/**
 * Fixed builds in their own void dimension with the look of the Orbital Station (biome dbe:space).
 * Travel follows the Universe 6 arena: use the item to go, use it again inside to return to the exact spot you left from.
 *
 * A build is a list of .mcstructure pieces at fixed coordinates. The pieces around the arrival point are placed before the
 * player travels; the rest are placed as a player comes near. A piece that fails is tried again with a growing delay and
 * never given up on, so a failure does not become a permanent hole. Placed pieces are saved in stateProp.
 */
import { acquireLoadedArea, releaseLoadedArea, safeTeleport, travelOrigin, safeReturnToEarth, reportTravelFailure, physicalDestinationId } from "./travel_safety.js";
import * as mc from "@minecraft/server";
import { isSpaceDimension } from "./space_planets.js";

const { world, system } = mc;

const NAMEK_ORIGIN_PROP = "dbe:namek_origin"; // "where you left Earth from", kept by the space system
const LOAD_TICKS = 10;
const MAX_RETRY_TICKS = 2400;

const distXZ = (x, z, p) => Math.hypot(Math.max(p.x - x, 0, x - (p.x + p.sx)), Math.max(p.z - z, 0, z - (p.z + p.sz)));

/**
 * label, dimId, item, events { go, back, rebuild? }, spawn, rotation?, fogTag, originProp, stateProp, fallY,
 * pieces [{ id, x, y, z, sx, sy, sz }], arrivalRadius, loadRadius, protectBlocks?, removeMobs?
 */
export function createSpaceArena(cfg) {
  const FOG_PUSH = "fog @s push dbe:fog_space " + cfg.fogTag;
  const FOG_POP = "fog @s remove " + cfg.fogTag;
  const travelling = new Set();
  const inside = new Map();
  const lastUse = new Map();
  const lastFall = new Map();
  const retry = new Map(); // piece index -> { fails, at }
  let placed = null;
  let placing = false;

  function loadPlaced() {
    if (placed) return placed;
    try {
      const raw = world.getDynamicProperty(cfg.stateProp);
      placed = new Set(typeof raw === "string" ? JSON.parse(raw) : []);
    } catch (e) {
      console.warn("[" + cfg.label + "] saved pieces unreadable, placing them again: " + e);
      placed = new Set();
    }
    return placed;
  }

  const savePlaced = () => world.setDynamicProperty(cfg.stateProp, JSON.stringify([...placed]));

  async function placePiece(dim, index) {
    const p = cfg.pieces[index];
    const area = await acquireLoadedArea(dim, { x: p.x, y: p.y, z: p.z }, { x: p.x + p.sx - 1, y: p.y, z: p.z + p.sz - 1 }, cfg.label + " " + p.id);
    try {
      world.structureManager.place(p.id, dim, { x: p.x, y: p.y, z: p.z });
      loadPlaced().add(index);
      savePlaced();
      retry.delete(index);
    } finally {
      releaseLoadedArea(area);
    }
  }

  /** Pieces around the arrival point, before the player travels. A failure cancels the trip and the player stays. */
  async function ensureArrival(dim) {
    const pending = cfg.pieces.map((p, i) => i).filter((i) => !loadPlaced().has(i) && distXZ(cfg.spawn.x, cfg.spawn.z, cfg.pieces[i]) <= cfg.arrivalRadius);
    while (placing) await new Promise((resolve) => system.runTimeout(resolve, 5));
    placing = true;
    try {
      for (const i of pending) {
        if (!loadPlaced().has(i)) await placePiece(dim, i);
        await new Promise((resolve) => system.runTimeout(resolve, 2));
      }
    } finally {
      placing = false;
    }
  }

  function rememberOrigin(player) {
    if (player.dimension.id === cfg.dimId) return;
    if (isSpaceDimension(player.dimension.id) || player.dimension.id === "dbe:namek" || player.dimension.id === "dbe:kai") {
      // arriving from space or another planet: the way home is the space system's saved Earth spot
      player.setDynamicProperty(cfg.originProp, undefined);
      return;
    }
    const { x, y, z } = player.location;
    const r = player.getRotation();
    player.setDynamicProperty(cfg.originProp, JSON.stringify({ d: player.dimension.id, x, y, z, rx: r.x, ry: r.y }));
  }

  async function sendToArena(player) {
    if (travelling.has(player.id)) return;
    travelling.add(player.id);
    let phase = "lookup";
    try {
      const dim = world.getDimension(cfg.dimId);
      phase = "generation";
      const origin = travelOrigin(player);
      rememberOrigin(player);
      player.sendMessage("§dTravelling to " + cfg.label + "... one moment.");
      await ensureArrival(dim);
      phase = "teleport";
      await safeTeleport(player, cfg.spawn, { origin, requireGround: true, dimension: dim, rotation: cfg.rotation ?? { x: 0, y: 0 }, maxDrift: Infinity, label: cfg.label });
    } catch (e) {
      reportTravelFailure(player, cfg.label, e, cfg.dimId, phase);
    } finally {
      travelling.delete(player.id);
    }
  }

  async function sendHome(player) {
    if (travelling.has(player.id)) return;
    travelling.add(player.id);
    let destinationId = "minecraft:overworld", phase = "origin";
    try {
      const raw = player.getDynamicProperty(cfg.originProp);
      let saved;
      try { saved = typeof raw === "string" ? JSON.parse(raw) : undefined; } catch {}
      if (saved && [saved.x, saved.y, saved.z].every(Number.isFinite) && typeof saved.d === "string") {
        destinationId = physicalDestinationId(saved.d);
        phase = "lookup";
        const dimension = world.getDimension(destinationId);
        phase = "teleport";
        await safeTeleport(player, { x: saved.x, y: saved.y, z: saved.z }, {
          dimension, requireGround: true,
          rotation: Number.isFinite(saved.rx) && Number.isFinite(saved.ry) ? { x: saved.rx, y: saved.ry } : undefined,
          label: cfg.label + " saved return",
        });
      } else {
        try { saved = JSON.parse(player.getDynamicProperty(NAMEK_ORIGIN_PROP)); } catch {}
        phase = "teleport";
        await safeReturnToEarth(player, { savedOrigin: saved, label: cfg.label + " return to Earth" });
      }
      if (raw !== undefined) player.setDynamicProperty(cfg.originProp, undefined);
      player.sendMessage("§aYou left " + cfg.label + ".");
    } catch (error) {
      reportTravelFailure(player, cfg.label + " return", error, destinationId, phase);
    } finally {
      travelling.delete(player.id);
    }
  }

  function scanPlayers() {
    for (const p of world.getPlayers()) {
      const now = p.dimension.id === cfg.dimId;
      if (now !== (inside.get(p.id) || false)) {
        inside.set(p.id, now);
        try { p.runCommand(now ? FOG_PUSH : FOG_POP); } catch (e) { /* ignore */ }
      }
      if (now && p.location.y < cfg.fallY && !travelling.has(p.id) && system.currentTick - (lastFall.get(p.id) ?? -1000) > 40) {
        lastFall.set(p.id, system.currentTick);
        try {
          p.teleport(cfg.spawn, { rotation: cfg.rotation ?? { x: 0, y: 0 } });
          p.sendMessage("§dYou fell and were brought back.");
        } catch (e) { /* ignore */ }
      }
    }
  }

  /** At most one piece per cycle: the unplaced one closest to a player. */
  function loadNearby() {
    if (placing || loadPlaced().size >= cfg.pieces.length) return;
    const dim = world.getDimension(cfg.dimId);
    const players = dim.getPlayers();
    if (!players.length) return;
    let best = -1, bestDistance = Infinity;
    cfg.pieces.forEach((piece, i) => {
      if (placed.has(i) || (retry.get(i)?.at ?? 0) > system.currentTick) return;
      for (const p of players) {
        const d = distXZ(p.location.x, p.location.z, piece);
        if (d <= cfg.loadRadius && d < bestDistance) { best = i; bestDistance = d; }
      }
    });
    if (best < 0) return;
    placing = true;
    placePiece(dim, best).catch((e) => {
      const fails = (retry.get(best)?.fails ?? 0) + 1;
      retry.set(best, { fails, at: system.currentTick + Math.min(MAX_RETRY_TICKS, 20 * 2 ** fails) });
      if (fails === 1 || fails % 10 === 0) console.warn("[" + cfg.label + "] piece " + cfg.pieces[best].id + " failed " + fails + " time(s): " + e);
    }).finally(() => { placing = false; });
  }

  function rebuild(player) {
    if (!(player.commandPermissionLevel >= 1) || placing) return;
    loadPlaced().clear();
    savePlaced();
    retry.clear();
    sendToArena(player);
  }

  try {
    world.afterEvents.worldLoad.subscribe(() => {
      system.runInterval(() => {
        try {
          scanPlayers();
          loadNearby();
        } catch (e) {
          console.warn("[" + cfg.label + "] scan error: " + e);
        }
      }, LOAD_TICKS);

      world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
        if (!itemStack || itemStack.typeId !== cfg.item) return;
        if (system.currentTick - (lastUse.get(source.id) ?? -1000) < 100) return;
        lastUse.set(source.id, system.currentTick);
        if (source.dimension.id === cfg.dimId) sendHome(source);
        else sendToArena(source);
      });

      system.afterEvents.scriptEventReceive.subscribe((ev) => {
        const src = ev.sourceEntity;
        if (!src || src.typeId !== "minecraft:player") return;
        if (ev.id === cfg.events.go) sendToArena(src);
        else if (ev.id === cfg.events.back) sendHome(src);
        else if (cfg.events.rebuild && ev.id === cfg.events.rebuild) rebuild(src);
      });

      if (cfg.removeMobs) {
        const isMob = (e) => {
          try { return e.typeId !== "minecraft:player" && e.matches({ families: ["mob"] }); } catch (err) { return false; }
        };
        world.afterEvents.entitySpawn.subscribe(({ entity }) => {
          try { if (entity.dimension.id === cfg.dimId && isMob(entity)) entity.remove(); } catch (e) { /* ignore */ }
        });
      }
      if (cfg.protectBlocks) {
        world.beforeEvents.explosion.subscribe((e) => {
          if (e.dimension.id === cfg.dimId) e.cancel = true;
        });
        world.beforeEvents.playerBreakBlock.subscribe((e) => {
          if (e.player.dimension.id === cfg.dimId) e.cancel = true;
        });
      }
    });
  } catch (e) {
    console.warn("[" + cfg.label + "] setup failed: " + e);
  }
}
