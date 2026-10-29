import { acquireLoadedArea, releaseLoadedArea, safeTeleport, travelOrigin, safeReturnToEarth, reportTravelFailure, physicalDestinationId } from "./travel_safety.js";
/**
 * Universe 6 arena dimension (dbe:universe_6_arena)
 *
 * The Tournament of Destroyers arena from the Universe 6 saga: a square white tiled stage floating in a
 * purple cosmos, the Grand Priest's gold emblem and the destroyers' desks and thrones behind it, pastel
 * orbs around the edge and huge glowing planets in the sky.
 *
 * Unlike Namek and Hell this is NOT generated around players. The arena is one fixed build, made once by
 * this script the first time somebody travels here (custom dimensions only support the void generator).
 *
 * Travel:
 *   Tournament Invitation (dbe:tournament_invitation, craftable): use it to go to the arena, use it again
 *   inside to return to the exact spot (and dimension) you left from.
 *   Operators / cheats enabled:
 *     /scriptevent dbe:tournament          -> go to the arena
 *     /scriptevent dbe:tournament_return   -> go back to where you left from (or your spawn point)
 *     /scriptevent dbe:tournament_rebuild  -> rebuild the arena (restores it if it was damaged)
 *   Space: the arena is also a planet at the Orbital Station (space_planets.js). Fly into it to land here, fly up to
 *   y >= 500 (or use the Star Navigator) to go back to space.
 */
import * as mc from "@minecraft/server";
import { isSpaceDimension } from "./space_planets.js";

const { world, system, BlockVolume, BlockPermutation } = mc;

const DIM_ID = "dbe:universe_6_arena";
const ITEM = "dbe:tournament_invitation";
const BUILD_VERSION = 1; // bump to make existing worlds rebuild the arena
const PROP_ARENA = "dbe:u6_arena_version";
const PROP_PLANETS = "dbe:u6_planets_version";
const ORIGIN_PROP = "dbe:u6_origin";
const FOG_PUSH = "fog @s push dbe:fog_universe_6 dbe_universe_6";
const FOG_POP = "fog @s remove dbe_universe_6";

// ---------------------------------------------------------------- layout
const Y0 = 100; // top of the surrounding floor
const FLOOR = 60; // the floor spans -FLOOR..FLOOR on x and z
const ST_MIN = -24; // stage spans ST_MIN..ST_MAX on x and z (48 x 48)
const ST_MAX = 23;
const SPAWN = { x: 0.5, y: Y0 + 1, z: 40.5 }; // feet immediately above the generated floor at Y0
const FALL_Y = Y0 - 40; // below this you fell off the world: back to the spawn
const GOKU_SPAWN = { x: 6.5, y: Y0 + 1, z: 40.5 };
const GOKU_TAG = "dbe:u6_goku";
let arenaGoku;

function ensureGoku(dim) {
  if (arenaGoku?.isValid) return;
  // The NPC has no movement AI: load its anchor before checking for an existing copy.
  if (!dim.isChunkLoaded(GOKU_SPAWN)) return;
  const existing = dim.getEntities({ type: "dbe:goku", tags: [GOKU_TAG] })[0];
  if (existing) {
    arenaGoku = existing;
    return;
  }
  const floor = dim.getBlock({ x: 6, y: Y0, z: 40 });
  if (!floor || floor.isAir || floor.isLiquid) return;
  if (
    !dim.getBlock({ x: 6, y: Y0 + 1, z: 40 })?.isAir ||
    !dim.getBlock({ x: 6, y: Y0 + 2, z: 40 })?.isAir
  ) return;
  const npc = dim.spawnEntity("dbe:goku", GOKU_SPAWN);
  try {
    npc.addTag(GOKU_TAG);
    npc.nameTag = "Goku";
    arenaGoku = npc;
  } catch (error) {
    if (npc.isValid) npc.remove();
    throw error;
  }
}

const planets = [
  // glowing gas giants so they stay visible at night; bands by latitude with a slight tilt
  { x: 80, y: Y0 + 35, z: -85, r: 30, bands: ["minecraft:shroomlight", "minecraft:pearlescent_froglight", "minecraft:ochre_froglight", "minecraft:pearlescent_froglight"] },
  { x: -95, y: Y0 + 45, z: -80, r: 14, bands: ["minecraft:sea_lantern", "minecraft:light_blue_concrete", "minecraft:cyan_concrete", "minecraft:sea_lantern"] },
  { x: 30, y: Y0 + 72, z: -125, r: 8, bands: ["minecraft:pearlescent_froglight", "minecraft:pink_concrete"] },
];

const orbs = [
  // x, z, radius, body, band
  [-31, 30, 3, "lime_concrete", "white_concrete"],
  [-20, 34, 2, "magenta_concrete", "pink_concrete"],
  [-8, 31, 2, "light_blue_concrete", "white_concrete"],
  [9, 33, 3, "white_concrete", "light_blue_concrete"],
  [21, 30, 2, "magenta_concrete", "white_concrete"],
  [32, 29, 3, "lime_concrete", "yellow_concrete"],
  [-35, 16, 2, "pink_concrete", "white_concrete"],
  [36, 12, 2, "light_blue_concrete", "blue_concrete"],
  [-35, 6, 3, "purple_concrete", "magenta_concrete"],
  [37, 4, 2, "white_concrete", "pink_concrete"],
  [-45, 40, 2, "purple_concrete", "light_blue_concrete"],
  [45, 40, 3, "lime_concrete", "white_concrete"],
  [-54, -22, 2, "light_blue_concrete", "white_concrete"],
  [54, -26, 3, "magenta_concrete", "purple_concrete"],
];

// ---------------------------------------------------------------- helpers
const mcId = (s) => (s.includes(":") ? s : "minecraft:" + s);
const waitTicks = (n) => new Promise((resolve) => system.runTimeout(resolve, n));
const chunkOf = (v) => Math.floor(v / 16);

function hash2(a, b) {
  let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + 0x55365) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const permCache = new Map();
function stairPerm(type, dir) {
  // weirdo_direction: 0 east, 1 west, 2 south, 3 north = direction the stairs rise towards
  const key = type + dir;
  if (!permCache.has(key)) {
    let perm;
    try {
      perm = BlockPermutation.resolve(mcId(type), { weirdo_direction: dir, upside_down_bit: false });
    } catch (e) {
      // state renamed in this game version: place the stairs facing the default way instead of aborting the arena build
      perm = type;
    }
    permCache.set(key, perm);
  }
  return permCache.get(key);
}

function set(dim, x, y, z, block) {
  try {
    if (typeof block === "string") dim.setBlockType({ x, y, z }, mcId(block));
    else dim.setBlockPermutation({ x, y, z }, block);
  } catch (e) {
    /* unloaded chunk or unknown block in this version: skip */
  }
}

/** fillBlocks that normalises corners and splits big volumes (one huge call is rejected). */
function fill(dim, x1, y1, z1, x2, y2, z2, block) {
  const ax = Math.min(x1, x2), bx = Math.max(x1, x2);
  const ay = Math.min(y1, y2), by = Math.max(y1, y2);
  const az = Math.min(z1, z2), bz = Math.max(z1, z2);
  const b = typeof block === "string" ? mcId(block) : block;
  const STEP = 24;
  for (let x = ax; x <= bx; x += STEP) {
    for (let z = az; z <= bz; z += STEP) {
      dim.fillBlocks(new BlockVolume({ x, y: ay, z }, { x: Math.min(x + STEP - 1, bx), y: by, z: Math.min(z + STEP - 1, bz) }), b);
    }
  }
}

/** Ellipse test for a vertical disc: 0 = centre, 1 = edge. */
const ell = (du, dv, a, b) => (du * du) / (a * a) + (dv * dv) / (b * b);

function* sphere(dim, cx, cy, cz, r, bodyAt, thickness = 0) {
  // thickness 0 = solid ball; otherwise a hollow shell of that thickness
  const Ri = r - thickness;
  let n = 0;
  for (let dy = -r; dy <= r; dy++) {
    for (let dz = -r; dz <= r; dz++) {
      const q = r * r - dy * dy - dz * dz;
      if (q < 0) continue;
      const outer = Math.floor(Math.sqrt(q));
      const block = bodyAt(dy, dz);
      if (thickness > 0 && Ri * Ri - dy * dy - dz * dz >= 0) {
        const inner = Math.floor(Math.sqrt(Ri * Ri - dy * dy - dz * dz)) + 1;
        if (inner <= outer) {
          fill(dim, cx - outer, cy + dy, cz + dz, cx - inner, cy + dy, cz + dz, block);
          fill(dim, cx + inner, cy + dy, cz + dz, cx + outer, cy + dy, cz + dz, block);
        }
      } else {
        fill(dim, cx - outer, cy + dy, cz + dz, cx + outer, cy + dy, cz + dz, block);
      }
      if (++n % 120 === 0) yield;
    }
  }
}

// ---------------------------------------------------------------- the arena
function* buildArena(dim) {
  const ZMIN = -FLOOR, ZMAX = FLOOR;

  // 1) surrounding floor: mauve terrain with a bright rim
  fill(dim, -FLOOR, Y0 - 2, ZMIN, FLOOR, Y0, ZMAX, "purple_terracotta");
  yield;
  fill(dim, -FLOOR, Y0, ZMIN, FLOOR, Y0, ZMIN, "light_blue_concrete");
  fill(dim, -FLOOR, Y0, ZMAX, FLOOR, Y0, ZMAX, "light_blue_concrete");
  fill(dim, -FLOOR, Y0, ZMIN, -FLOOR, Y0, ZMAX, "light_blue_concrete");
  fill(dim, FLOOR, Y0, ZMIN, FLOOR, Y0, ZMAX, "light_blue_concrete");
  yield;
  for (let x = -FLOOR + 1; x < FLOOR; x++) {
    for (let z = ZMIN + 1; z < ZMAX; z++) {
      const h = hash2(x, z);
      if (h < 0.06) set(dim, x, Y0, z, "pink_terracotta");
      else if (h < 0.1) set(dim, x, Y0, z, "magenta_terracotta");
    }
    if (x % 8 === 0) yield;
  }
  yield;

  // 2) the stage: quartz base, white tiles with faint grid lines, light blue border
  fill(dim, ST_MIN, Y0 - 2, ST_MIN, ST_MAX, Y0, ST_MAX, "smooth_quartz");
  fill(dim, ST_MIN, Y0 + 1, ST_MIN, ST_MAX, Y0 + 1, ST_MAX, "white_concrete");
  for (let g = ST_MIN + 8; g < ST_MAX; g += 8) {
    fill(dim, g, Y0 + 1, ST_MIN + 1, g, Y0 + 1, ST_MAX - 1, "light_gray_concrete");
    fill(dim, ST_MIN + 1, Y0 + 1, g, ST_MAX - 1, Y0 + 1, g, "light_gray_concrete");
  }
  fill(dim, ST_MIN, Y0 + 1, ST_MIN, ST_MAX, Y0 + 1, ST_MIN, "light_blue_concrete");
  fill(dim, ST_MIN, Y0 + 1, ST_MAX, ST_MAX, Y0 + 1, ST_MAX, "light_blue_concrete");
  fill(dim, ST_MIN, Y0 + 1, ST_MIN, ST_MIN, Y0 + 1, ST_MAX, "light_blue_concrete");
  fill(dim, ST_MAX, Y0 + 1, ST_MIN, ST_MAX, Y0 + 1, ST_MAX, "light_blue_concrete");
  fill(dim, ST_MIN, Y0, ST_MIN, ST_MAX, Y0, ST_MIN, "cyan_concrete");
  fill(dim, ST_MIN, Y0, ST_MAX, ST_MAX, Y0, ST_MAX, "cyan_concrete");
  fill(dim, ST_MIN, Y0, ST_MIN, ST_MIN, Y0, ST_MAX, "cyan_concrete");
  fill(dim, ST_MAX, Y0, ST_MIN, ST_MAX, Y0, ST_MAX, "cyan_concrete");
  yield;

  // 3) desks: quartz body, sea-green sloped control panel, quartz backrest
  const COPPER_STAIRS = "waxed_oxidized_cut_copper_stairs";
  // back desk (faces south, towards the stage)
  fill(dim, -7, Y0 + 1, -33, 7, Y0 + 2, -31, "smooth_quartz");
  for (let x = -7; x <= 7; x++) {
    set(dim, x, Y0 + 3, -31, stairPerm(COPPER_STAIRS, 3));
    set(dim, x, Y0 + 3, -32, "waxed_oxidized_cut_copper");
    set(dim, x, Y0 + 3, -33, "smooth_quartz");
    set(dim, x, Y0 + 4, -33, "smooth_quartz");
  }
  // west desk (faces east) and east desk (faces west)
  fill(dim, -31, Y0 + 1, -22, -29, Y0 + 2, -2, "smooth_quartz");
  fill(dim, 29, Y0 + 1, -22, 31, Y0 + 2, -2, "smooth_quartz");
  for (let z = -22; z <= -2; z++) {
    set(dim, -29, Y0 + 3, z, stairPerm(COPPER_STAIRS, 1));
    set(dim, -30, Y0 + 3, z, "waxed_oxidized_cut_copper");
    set(dim, -31, Y0 + 3, z, "smooth_quartz");
    set(dim, -31, Y0 + 4, z, "smooth_quartz");
    set(dim, 29, Y0 + 3, z, stairPerm(COPPER_STAIRS, 0));
    set(dim, 30, Y0 + 3, z, "waxed_oxidized_cut_copper");
    set(dim, 31, Y0 + 3, z, "smooth_quartz");
    set(dim, 31, Y0 + 4, z, "smooth_quartz");
  }
  yield;

  // 4) gold emblem behind the back desk: gold ring, white face, blue clock hands
  const EC = { x: 0, y: Y0 + 12, z: -38 };
  fill(dim, -1, Y0 + 1, -38, 1, Y0 + 2, -37, "gold_block");
  for (let dx = -7; dx <= 7; dx++) {
    for (let dy = -9; dy <= 9; dy++) {
      const v = ell(dx, dy, 6.5, 9);
      if (v > 1) continue;
      if (v > 0.66) {
        set(dim, EC.x + dx, EC.y + dy, EC.z, "gold_block");
        set(dim, EC.x + dx, EC.y + dy, EC.z + 1, "gold_block");
      } else {
        set(dim, EC.x + dx, EC.y + dy, EC.z + 1, "white_concrete");
        set(dim, EC.x + dx, EC.y + dy, EC.z, "white_concrete");
      }
    }
  }
  for (let k = 0; k <= 5; k++) set(dim, EC.x, EC.y + k, EC.z + 2, "blue_concrete"); // minute hand
  for (let k = 1; k <= 3; k++) set(dim, EC.x + k, EC.y, EC.z + 2, "blue_concrete"); // hour hand
  set(dim, EC.x, EC.y, EC.z + 2, "gold_block");
  yield;

  // 5) thrones: round backs (blue rim, gold ring, glass face) on a gold pedestal, facing the stage
  for (const side of [-1, 1]) {
    const tx = side * 37; // plane of the round back
    const cz = -12;
    const cy = Y0 + 10;
    fill(dim, side * 34, Y0 + 1, cz - 1, side * 36, Y0 + 1, cz + 1, "gold_block");
    set(dim, side * 35, Y0 + 2, cz, stairPerm("quartz_stairs", side === -1 ? 1 : 0));
    for (let dz = -7; dz <= 7; dz++) {
      for (let dy = -8; dy <= 8; dy++) {
        const v = ell(dz, dy, 6.5, 8);
        if (v > 1) continue;
        const block = v > 0.8 ? "blue_concrete" : v > 0.55 ? "gold_block" : v < 0.08 ? "sea_lantern" : "light_blue_stained_glass";
        set(dim, tx, cy + dy, cz + dz, block);
      }
    }
    // post joining the back to the pedestal
    fill(dim, tx, Y0 + 2, cz, tx, cy - 7, cz, "gold_block");
  }
  yield;

  // 6) pastel orbs around the edge (resting on the floor, with a coloured equator)
  for (const [ox, oz, r, body, band] of orbs) {
    yield* sphere(dim, ox, Y0 + r, oz, r, (dy) => (dy === 0 ? band : body), 0);
    yield;
  }

  // 7) invisible lights so the arena stays bright when it is night
  for (let x = -54; x <= 54; x += 12) {
    for (let z = -54; z <= 54; z += 12) set(dim, x, Y0 + 4, z, "light_block_15");
  }
  yield;

  // 8) verify before marking the arena as built
  const tile = dim.getBlock({ x: 5, y: Y0 + 1, z: 5 });
  const base = dim.getBlock({ x: 50, y: Y0, z: 50 });
  const ring = dim.getBlock({ x: 0, y: EC.y + 8, z: EC.z });
  if (!tile || tile.typeId !== "minecraft:white_concrete" || !base || !ring) throw new Error("arena verification failed");
}

function* buildPlanet(dim, p) {
  const bandAt = (dy, dz) => {
    const i = Math.floor((dy + dz * 0.12 + p.r * 2) / 3.5);
    return mcId(p.bands[((i % p.bands.length) + p.bands.length) % p.bands.length]);
  };
  yield* sphere(dim, p.x, p.y, p.z, p.r, bandAt, 2);
}

// ---------------------------------------------------------------- build runner
function runJobAsync(gen) {
  return new Promise((resolve, reject) => {
    system.runJob(
      (function* () {
        try {
          yield* gen;
          resolve();
        } catch (e) {
          reject(e);
        }
      })()
    );
  });
}

async function withArea(dim, id, x1, z1, x2, z2, work) {
  const area = await acquireLoadedArea(dim, { x: x1, y: Y0, z: z1 }, { x: x2, y: Y0, z: z2 }, id);
  try {
    await work();
  } finally {
    releaseLoadedArea(area);
  }
}

let arenaBuild = null; // promise while the arena is being built
let planetBuild = null;

function ensureArena(force = false) {
  if (!force && world.getDynamicProperty(PROP_ARENA) === BUILD_VERSION) return Promise.resolve();
  if (arenaBuild) return arenaBuild;
  arenaBuild = Promise.resolve().then(async () => {
    try {
      const dim = world.getDimension(DIM_ID);
      await withArea(dim, "dbe:u6_arena_" + system.currentTick, -FLOOR, -FLOOR, FLOOR, FLOOR, async () => {
        await runJobAsync(buildArena(dim));
      });
      world.setDynamicProperty(PROP_ARENA, BUILD_VERSION);
    } finally {
      arenaBuild = null;
    }
  });
  return arenaBuild;
}

function ensurePlanets(force = false) {
  if (!force && world.getDynamicProperty(PROP_PLANETS) === BUILD_VERSION) return Promise.resolve();
  if (planetBuild) return planetBuild;
  planetBuild = (async () => {
    try {
      const dim = world.getDimension(DIM_ID);
      for (const p of planets) {
        const pad = 8;
        await withArea(dim, "dbe:u6_planet_" + system.currentTick, p.x - p.r - pad, p.z - p.r - pad, p.x + p.r + pad, p.z + p.r + pad, async () => {
          await runJobAsync(buildPlanet(dim, p));
        });
      }
      world.setDynamicProperty(PROP_PLANETS, BUILD_VERSION);
    } catch (e) {
      console.warn("[Universe 6] planets failed (will retry on the next visit): " + e);
    } finally {
      planetBuild = null;
    }
  })();
  return planetBuild;
}

// ---------------------------------------------------------------- travel
const travelling = new Set();
const lastUse = new Map();
const inArena = new Map();
const lastFall = new Map();

const NAMEK_ORIGIN_PROP = "dbe:namek_origin"; // "where you left Earth from", kept by the space system

function rememberOrigin(player) {
  if (player.dimension.id === DIM_ID) return;
  if (isSpaceDimension(player.dimension.id) || player.dimension.id === "dbe:namek" || player.dimension.id === "dbe:kai") {
    // arriving from space or another planet: the way home is the space system's saved Earth spot, not a point there
    try {
      player.setDynamicProperty(ORIGIN_PROP, undefined);
    } catch (e) {
      /* ignore */
    }
    return;
  }
  try {
    const { x, y, z } = player.location;
    const r = player.getRotation();
    player.setDynamicProperty(ORIGIN_PROP, JSON.stringify({ d: player.dimension.id, x, y, z, rx: r.x, ry: r.y }));
  } catch (e) {
    console.warn("[Universe 6] could not remember origin: " + e);
  }
}

async function sendToArena(player, force = false) {
  if (travelling.has(player.id)) return;
  travelling.add(player.id);
  let phase = "lookup";
  try {
    const dim = world.getDimension(DIM_ID);
    phase = "generation";
    const origin = travelOrigin(player);
    const first = world.getDynamicProperty(PROP_ARENA) !== BUILD_VERSION || force;
    rememberOrigin(player);
    player.sendMessage(first ? "§dThe arena is being prepared... one moment." : "§dTravelling to the Tournament of Destroyers arena...");
    await ensureArena(force);
    phase = "teleport";
    await safeTeleport(player, SPAWN, { origin, requireGround: true, dimension: dim, rotation: { x: 0, y: 180 } });
    ensurePlanets(force); // the planets finish building while the player looks around
  } catch (e) {
    reportTravelFailure(player, "Universe 6", e, DIM_ID, phase);
  } finally {
    travelling.delete(player.id);
  }
}

async function sendHome(player) {
  if (travelling.has(player.id)) return;
  travelling.add(player.id);
  let destinationId = "minecraft:overworld", phase = "origin";
  try {
    const raw = player.getDynamicProperty(ORIGIN_PROP);
    let savedOrigin;
    try { savedOrigin = typeof raw === "string" ? JSON.parse(raw) : undefined; } catch {}
    if (savedOrigin && [savedOrigin.x, savedOrigin.y, savedOrigin.z].every(Number.isFinite) && typeof savedOrigin.d === "string" && savedOrigin.d !== "minecraft:overworld" && physicalDestinationId(savedOrigin.d) !== DIM_ID) {
      destinationId = physicalDestinationId(savedOrigin.d);
      phase = "lookup";
      const dimension = world.getDimension(destinationId);
      phase = "teleport";
      await safeTeleport(player, { x: savedOrigin.x, y: savedOrigin.y, z: savedOrigin.z }, {
        dimension, requireGround: true,
        rotation: Number.isFinite(savedOrigin.rx) && Number.isFinite(savedOrigin.ry) ? { x: savedOrigin.rx, y: savedOrigin.ry } : undefined,
        label: "Universe 6 saved return",
      });
    } else {
      if (!savedOrigin || savedOrigin.d !== "minecraft:overworld") {
        try { savedOrigin = JSON.parse(player.getDynamicProperty(NAMEK_ORIGIN_PROP)); } catch {}
      }
      await safeReturnToEarth(player, { savedOrigin, label: "Universe 6 return to Earth" });
    }
    phase = "teleport";
    if (raw !== undefined) player.setDynamicProperty(ORIGIN_PROP, undefined);
    player.sendMessage("\u00a7aYou left the arena.");
  } catch (error) {
    reportTravelFailure(player, "Universe 6 return", error, destinationId, phase);
  } finally { travelling.delete(player.id); }
}

function scan() {
  for (const p of world.getPlayers()) {
    const now = p.dimension.id === DIM_ID;
    if (now && world.getDynamicProperty(PROP_ARENA) === BUILD_VERSION) ensureGoku(p.dimension);
    if (now !== (inArena.get(p.id) || false)) {
      inArena.set(p.id, now);
      try {
        p.runCommand(now ? FOG_PUSH : FOG_POP);
      } catch (e) {
        /* ignore */
      }
    }
    // fell off the floating arena: back to the spawn
    if (now && p.location.y < FALL_Y && !travelling.has(p.id) && system.currentTick - (lastFall.get(p.id) ?? -1000) > 40) {
      lastFall.set(p.id, system.currentTick);
      try {
        p.teleport(SPAWN, { rotation: { x: 0, y: 180 } });
        p.sendMessage("§dYou fell off the arena and were brought back.");
      } catch (e) {
        /* ignore */
      }
    }
  }
}

// ---------------------------------------------------------------- setup
try {
  // dimensions/universe_6_arena.json owns the native dimension definition and its biome/height settings.

  world.afterEvents.worldLoad.subscribe(() => {
    system.runInterval(() => {
      try {
        scan();
      } catch (e) {
        console.warn("[Universe 6] scan error: " + e);
      }
    }, 10);

    world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
      if (!itemStack || itemStack.typeId !== ITEM) return;
      if (system.currentTick - (lastUse.get(source.id) ?? -1000) < 100) return;
      lastUse.set(source.id, system.currentTick);
      if (source.dimension.id === DIM_ID) sendHome(source);
      else sendToArena(source);
    });

    system.afterEvents.scriptEventReceive.subscribe((ev) => {
      const src = ev.sourceEntity;
      if (!src || src.typeId !== "minecraft:player") return;
      if (ev.id === "dbe:tournament") sendToArena(src);
      else if (ev.id === "dbe:tournament_return") sendHome(src);
      else if (ev.id === "dbe:tournament_rebuild") sendToArena(src, true);
    });
  });
} catch (e) {
  console.warn("[Universe 6] setup failed: " + e);
}
