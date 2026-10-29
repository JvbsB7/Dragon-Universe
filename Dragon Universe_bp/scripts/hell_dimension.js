import { acquireLoadedArea, releaseLoadedArea, safeTeleport, travelOrigin, safeReturnToEarth, reportTravelFailure, physicalDestinationId } from "./travel_safety.js";
/**
 * Hell dimension (dbe:hell)
 *
 * The Dragon Ball Hell: a blood-red sky and haze, a cracked red wasteland, boiling Blood Ponds and lava
 * lakes, Needle Mountains of black rock, scattered flames, bones and skulls, and the Hell Gate you arrive at.
 *
 * Like Namek, custom dimensions only support the void generator, so the land is built by this script, chunk by
 * chunk, around players. Terrain is deterministic (see hell_terrain.js) and a marker block in the bottom bedrock
 * row of each chunk records whether it was already generated or decorated, so chunks are never generated
 * twice and player builds are never overwritten.
 *
 * Travel (operators / cheats enabled):
 *   /scriptevent dbe:hell          -> go to Hell (arrive in front of the Hell Gate)
 *   /scriptevent dbe:hell_return   -> go back to where you left from (or your spawn point)
 */
import * as mc from "@minecraft/server";
import { registerVillagePlanet } from "./planet_villages.js";
import { MIN_Y, LEVEL, PLAZA_Y, CENTER, PLAZA_R, CORE, GROUND, heightAt, liquidAt, topBlock, distCenter, mulberry32 } from "./hell_terrain.js";

const { world, system, BlockVolume } = mc;

// Villages: built by planet_villages.js (neutral dbe:hell_villager, hostile only after being hit)
const HELL_P = { key: "hell", id: "dbe:hell", seed: 0x48454c4c, top: GROUND, sub: CORE, liquid: "minecraft:lava", liquidLevel: LEVEL };
const villages = registerVillagePlanet("hell", {
  heightAt: (P, x, z) => heightAt(x, z),
  nearSpawn: (P, x, z, r) => distCenter(x, z) <= r, // keep villages away from the Hell Gate plaza
});

const DIM_ID = "dbe:hell";
const TERRAIN_RADIUS = 3; // chunks generated around each player
const DECOR_RADIUS = 2; // chunks decorated around each player (needs generated neighbours)
const SCAN_TICKS = 4;
const CORE_SLAB = 8; // layers per fillBlocks call when building the rock core of a chunk
const SEED = 0x48454c4c;
const FOG_PUSH = "fog @s push dbe:fog_hell dbe_hell";
const FOG_POP = "fog @s remove dbe_hell";

// Falling off the Other World (below this y, in this dimension) drops you into Hell
const OTHER_WORLD = { dim: "dbe:other_world", fallY: -48, returnTo: { x: 0.5, y: 65, z: 39.5 } };
// Flying up this high in Hell takes you back to the Other World
const ESCAPE_Y = 300;
const FALL_START_Y = PLAZA_Y + 90; // fallers appear this high above the Hell Gate and drift down on slow falling

// Arrival point: in front of the Hell Gate (the gate stands across x 1..14 at z 7..9 of chunk 0,0)
const SPAWN = { x: CENTER.x + 0.5, y: PLAZA_Y + 1, z: 14.5 };

// ---------------------------------------------------------------- helpers

const chunkOf = (v) => Math.floor(v / 16);

function offsetsWithin(r) {
  const list = [];
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) list.push([dx, dz]);
  list.sort((p, q) => p[0] * p[0] + p[1] * p[1] - (q[0] * q[0] + q[1] * q[1]));
  return list;
}
const OFFSETS_TERRAIN = offsetsWithin(TERRAIN_RADIUS);
const OFFSETS_DECOR = offsetsWithin(DECOR_RADIUS);
const NEIGHBOURS = offsetsWithin(1).filter((o) => o[0] !== 0 || o[1] !== 0);

// ---------------------------------------------------------------- chunk generation

/** 0 = not generated, 1 = terrain only, 2 = terrain + decoration, -1 = chunk not loaded. */
function chunkState(dim, cx, cz) {
  const x0 = cx * 16;
  const z0 = cz * 16;
  const a = dim.getBlock({ x: x0, y: MIN_Y, z: z0 });
  if (!a) return -1;
  if (a.typeId !== "minecraft:bedrock") return 0;
  const b = dim.getBlock({ x: x0 + 1, y: MIN_Y, z: z0 });
  if (!b) return -1;
  return b.typeId === "minecraft:bedrock" ? 2 : 1;
}

function* terrainJob(dim, cx, cz) {
  const x0 = cx * 16;
  const z0 = cz * 16;
  const hs = new Array(256);
  let minH = 999;
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
      const h = heightAt(x0 + i, z0 + j);
      hs[i * 16 + j] = h;
      if (h < minH) minH = h;
    }
  }
  // Solid core of the whole chunk, in thin slabs (one huge fillBlocks is rejected above the volume limit)
  for (let y = MIN_Y + 1; y <= minH - 4; y += CORE_SLAB) {
    const top = Math.min(y + CORE_SLAB - 1, minH - 4);
    dim.fillBlocks(new BlockVolume({ x: x0, y, z: z0 }, { x: x0 + 15, y: top, z: z0 + 15 }), CORE);
    if (((y - MIN_Y) / CORE_SLAB) % 6 === 5) yield;
  }
  yield;
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
      const h = hs[i * 16 + j];
      const x = x0 + i;
      const z = z0 + j;
      const liquid = liquidAt(x, z, h);
      if (liquid) {
        // lake bed is black rock; blood (red-tinted water) or lava above
        dim.fillBlocks(new BlockVolume({ x, y: minH - 3, z }, { x, y: h, z }), CORE);
        dim.fillBlocks(new BlockVolume({ x, y: h + 1, z }, { x, y: LEVEL, z }), liquid === 2 ? "minecraft:lava" : "minecraft:water");
      } else {
        const rock = topBlock(h);
        // red crust on the lowlands, pure black rock on the needles
        if (h - 4 >= minH - 3) dim.fillBlocks(new BlockVolume({ x, y: minH - 3, z }, { x, y: h - 4, z }), CORE);
        dim.fillBlocks(new BlockVolume({ x, y: Math.max(h - 3, minH - 3), z }, { x, y: h, z }), rock);
      }
    }
    yield;
  }
  // Safety net: verify before marking the chunk done, so a failed chunk is retried instead of left as a hole.
  for (const [i, j] of [[0, 0], [15, 0], [0, 15], [15, 15], [8, 8], [3, 12]]) {
    const h = hs[i * 16 + j];
    const liquid = liquidAt(x0 + i, z0 + j, h);
    const want = liquid === 2 ? "minecraft:lava" : liquid === 1 ? "minecraft:water" : topBlock(h);
    const at = liquid ? LEVEL : h;
    const b = dim.getBlock({ x: x0 + i, y: at, z: z0 + j });
    const core = dim.getBlock({ x: x0 + i, y: MIN_Y + 1, z: z0 + j });
    if (!b || b.typeId !== want || !core || core.typeId !== CORE) {
      throw new Error("terrain verification failed in chunk " + cx + "," + cz);
    }
  }
  // markers (written last): bedrock floor = terrain done; x0+1 is rock until decorated
  dim.fillBlocks(new BlockVolume({ x: x0, y: MIN_Y, z: z0 }, { x: x0 + 15, y: MIN_Y, z: z0 + 15 }), "minecraft:bedrock");
  dim.setBlockType({ x: x0 + 1, y: MIN_Y, z: z0 }, CORE);
}

// ---------------------------------------------------------------- decoration

const set = (dim, x, y, z, type) => {
  try {
    dim.setBlockType({ x, y, z }, type);
  } catch (e) {
    /* chunk edge / unloaded: skip */
  }
};

/** Ribcage of a giant: bone arches standing in the wasteland. */
function ribcage(dim, x, z, rng) {
  const ribs = 3 + Math.floor(rng() * 3);
  const alongX = rng() < 0.5;
  const width = 5;
  for (let k = 0; k < ribs; k++) {
    const ox = alongX ? x + k * 2 : x;
    const oz = alongX ? z : z + k * 2;
    const ax = alongX ? 0 : 1; // arch spans the other axis
    const az = alongX ? 1 : 0;
    const colA = { x: ox, z: oz };
    const colB = { x: ox + ax * (width - 1), z: oz + az * (width - 1) };
    const gA = heightAt(colA.x, colA.z);
    const gB = heightAt(colB.x, colB.z);
    if (liquidAt(colA.x, colA.z, gA) || liquidAt(colB.x, colB.z, gB)) continue;
    const top = Math.max(gA, gB) + 5;
    for (let y = gA + 1; y <= top - 1; y++) set(dim, colA.x, y, colA.z, "minecraft:bone_block");
    for (let y = gB + 1; y <= top - 1; y++) set(dim, colB.x, y, colB.z, "minecraft:bone_block");
    for (let t = 1; t < width - 1; t++) set(dim, ox + ax * t, top, oz + az * t, "minecraft:bone_block");
  }
}

function boneHeap(dim, x, z, rng) {
  const g = heightAt(x, z);
  if (liquidAt(x, z, g)) return;
  const n = 1 + Math.floor(rng() * 3);
  for (let y = g + 1; y <= g + n; y++) set(dim, x, y, z, "minecraft:bone_block");
  set(dim, x, g + n + 1, z, rng() < 0.2 ? "minecraft:wither_skeleton_skull" : "minecraft:skeleton_skull");
}

/** Hell Gate: two horned pillars and a lintel, standing on the arrival plaza of chunk (0,0). */
function buildGate(dim) {
  const y0 = PLAZA_Y;
  const BR = "minecraft:polished_blackstone_bricks";
  const CH = "minecraft:chiseled_polished_blackstone";
  const RED = "minecraft:red_nether_bricks";
  const pillars = [2, 12]; // x of the pillar's west edge (3 wide), z 7..9
  for (const px of pillars) {
    for (let y = y0 + 1; y <= y0 + 13; y++) {
      for (let dx = 0; dx < 3; dx++) {
        for (let dz = 0; dz < 3; dz++) {
          const edge = dx !== 1 || dz !== 1;
          set(dim, px + dx, y, 7 + dz, y === y0 + 1 || y === y0 + 13 ? CH : edge ? BR : RED);
        }
      }
    }
    // horns
    for (const [hx, hz] of [[px, 7], [px + 2, 7], [px, 9], [px + 2, 9]]) {
      for (let k = 1; k <= 3; k++) set(dim, hx, y0 + 13 + k, hz, "minecraft:blackstone_wall");
    }
    // flame braziers at the foot of each pillar
    set(dim, px + 1, y0 + 1, 11, "minecraft:soul_soil");
    set(dim, px + 1, y0 + 2, 11, "minecraft:soul_fire");
  }
  // lintel (x 2..14), two blocks thick, crowned with skulls
  for (let x = 2; x <= 14; x++) {
    for (let y = y0 + 11; y <= y0 + 13; y++) for (let z = 7; z <= 9; z++) set(dim, x, y, z, y === y0 + 13 ? CH : BR);
    if ((x - 2) % 3 === 0) set(dim, x, y0 + 14, 8, "minecraft:skeleton_skull");
  }
  // curtain of fire inside the gate
  for (let x = 5; x <= 11; x++) {
    set(dim, x, y0 + 1, 8, "minecraft:netherrack");
    set(dim, x, y0 + 2, 8, "minecraft:fire");
  }
}

function* decorateJob(dim, cx, cz) {
  const x0 = cx * 16;
  const z0 = cz * 16;
  const rng = mulberry32(Math.imul(cx, 73856093) ^ Math.imul(cz, 19349663) ^ SEED);
  const pick = () => ({ x: x0 + Math.floor(rng() * 16), z: z0 + Math.floor(rng() * 16) });
  const nearPlaza = (x, z) => distCenter(x, z) < PLAZA_R + 4 || villages.near(HELL_P, x, z, 4);

  // villages first (they level the ground inside this chunk); everything below keeps clear of them
  yield* villages.buildInChunk({ dim, P: HELL_P, cx, cz, x0, z0 });
  yield;

  if (cx === 0 && cz === 0) {
    buildGate(dim);
    yield;
  }

  // flames burning forever on the netherrack
  for (let n = 0; n < 7; n++) {
    const p = pick();
    if (rng() > 0.45) continue;
    const h = heightAt(p.x, p.z);
    if (liquidAt(p.x, p.z, h) || topBlock(h) !== GROUND || nearPlaza(p.x, p.z)) continue;
    set(dim, p.x, h + 1, p.z, "minecraft:fire");
  }
  yield;
  // bones and skulls
  for (let n = 0; n < 3; n++) {
    const p = pick();
    if (rng() > 0.4 || nearPlaza(p.x, p.z)) continue;
    boneHeap(dim, p.x, p.z, rng);
  }
  yield;
  // giant ribcages (rare)
  if (rng() < 0.07) {
    const p = pick();
    if (!nearPlaza(p.x, p.z) && !villages.near(HELL_P, p.x, p.z, 14)) ribcage(dim, p.x, p.z, rng);
  }
  yield;
  // magma patches (rare, away from the plaza)
  if (rng() < 0.25) {
    const p = pick();
    const h = heightAt(p.x, p.z);
    if (!nearPlaza(p.x, p.z) && !liquidAt(p.x, p.z, h) && topBlock(h) === GROUND) {
      for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1]]) {
        const hh = heightAt(p.x + dx, p.z + dz);
        if (hh === h) set(dim, p.x + dx, hh, p.z + dz, "minecraft:magma");
      }
    }
  }
  yield;
  dim.setBlockType({ x: x0 + 1, y: MIN_Y, z: z0 }, "minecraft:bedrock");
}

// ---------------------------------------------------------------- job runner (one chunk job at a time)

let busy = false;
const retryAt = new Map();

const waitTicks = (n) => new Promise((resolve) => system.runTimeout(resolve, n));

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

async function runExclusive(gen, key, strict = false) {
  const deadline = system.currentTick + 600;
  while (busy) {
    if (system.currentTick >= deadline) {
      if (strict) throw new Error("Terrain preparation queue timed out");
      return;
    }
    await waitTicks(2);
  }
  busy = true;
  try {
    await runJobAsync(gen);
    retryAt.delete(key);
  } catch (e) {
    retryAt.set(key, system.currentTick + 100);
    console.warn("[Hell] chunk " + key + " failed: " + e);
    if (strict) throw e;
  } finally {
    busy = false;
    // keep generating straight away so fast travellers do not outrun the terrain
    system.run(() => {
      try {
        scan();
      } catch (e) {
        /* ignore */
      }
    });
  }
}

function canRetry(key) {
  const t = retryAt.get(key);
  return t === undefined || system.currentTick >= t;
}

// ---------------------------------------------------------------- per-player scan

const inHell = new Map(); // player id -> was in Hell at last scan
let tickCount = 0;
const lastFall = new Map(); // player id -> tick of the last fall-through attempt (stops retry spam)

/** Embers and ash drifting through the air around a player. */
function ambient(dim, p) {
  const { x, y, z } = p.location;
  for (let n = 0; n < 6; n++) {
    const px = x + (Math.random() - 0.5) * 36;
    const pz = z + (Math.random() - 0.5) * 36;
    const py = y + (Math.random() - 0.3) * 14;
    try {
      dim.spawnParticle(n % 3 === 0 ? "minecraft:basic_flame_particle" : "minecraft:campfire_smoke_particle", { x: px, y: py, z: pz });
    } catch (e) {
      /* particle not available */
    }
  }
}

function scan() {
  const players = world.getPlayers();
  tickCount++;

  // fog on enter / leave
  for (const p of players) {
    const now = p.dimension.id === DIM_ID;
    if (now !== (inHell.get(p.id) || false)) {
      inHell.set(p.id, now);
      try {
        p.runCommand(now ? FOG_PUSH : FOG_POP);
      } catch (e) {
        /* ignore */
      }
    }
    if (now && tickCount % 5 === 0) ambient(p.dimension, p);
    // flew out of the top of Hell: back to the Other World
    if (now && p.location.y >= ESCAPE_Y) escapeToOtherWorld(p);
    // fell off the Other World: entrance to Hell
    if (p.dimension.id === OTHER_WORLD.dim && p.location.y < OTHER_WORLD.fallY && !travelling.has(p.id) && system.currentTick - (lastFall.get(p.id) ?? -1000) > 200) {
      lastFall.set(p.id, system.currentTick);
      sendToHell(p, true);
    }
  }

  if (busy) return;
  let dim;
  try {
    dim = world.getDimension(DIM_ID);
  } catch (e) {
    return; // dimension not available
  }

  for (const p of players) {
    if (p.dimension.id !== DIM_ID) continue;
    const { x, y, z } = p.location;

    // fell through not-yet-generated terrain: put the player back on the surface
    if (y < MIN_Y + 8) {
      try {
        p.teleport({ x, y: Math.max(heightAt(Math.floor(x), Math.floor(z)), LEVEL) + 2, z });
      } catch (e) {
        /* ignore */
      }
    }

    const pcx = chunkOf(x);
    const pcz = chunkOf(z);

    for (const [dx, dz] of OFFSETS_TERRAIN) {
      const cx = pcx + dx;
      const cz = pcz + dz;
      const k = cx + "," + cz;
      if (!canRetry(k)) continue;
      if (chunkState(dim, cx, cz) === 0) {
        runExclusive(terrainJob(dim, cx, cz), k);
        return;
      }
    }
    for (const [dx, dz] of OFFSETS_DECOR) {
      const cx = pcx + dx;
      const cz = pcz + dz;
      const k = cx + "," + cz;
      if (!canRetry(k)) continue;
      if (chunkState(dim, cx, cz) !== 1) continue;
      if (NEIGHBOURS.every(([nx, nz]) => chunkState(dim, cx + nx, cz + nz) >= 1)) {
        runExclusive(decorateJob(dim, cx, cz), "d" + k);
        return;
      }
    }
  }
}

// ---------------------------------------------------------------- travel

async function escapeToOtherWorld(player) {
  try {
    const r = OTHER_WORLD.returnTo;
    await safeTeleport(player, { x: r.x, y: r.y, z: r.z }, { dimension: world.getDimension(OTHER_WORLD.dim), rotation: { x: 0, y: 0 } });
    try {
      player.removeEffect("slow_falling");
    } catch (e) {
      /* none active */
    }
    player.setDynamicProperty(ORIGIN_PROP, undefined);
    player.sendMessage("§bYou climbed out of Hell and returned to the Other World.");
  } catch (e) {
    console.warn("[Hell] escape failed: " + e);
  }
}

/** Removes a temporary ticking area; never throws (the area may already be gone). */
function removeArea(id) {
  releaseLoadedArea(id);
}

async function prepareArea(dim, cx, cz) {
  const id = await acquireLoadedArea(dim,
    { x: (cx - TERRAIN_RADIUS) * 16, y: MIN_Y, z: (cz - TERRAIN_RADIUS) * 16 },
    { x: (cx + TERRAIN_RADIUS + 1) * 16 - 1, y: MIN_Y, z: (cz + TERRAIN_RADIUS + 1) * 16 - 1 },
    "hell_dimension.js: destination preparation");
  try {
    for (const [dx, dz] of OFFSETS_TERRAIN) {
      if (chunkState(dim, cx + dx, cz + dz) === 0) await runExclusive((function* () { if (chunkState(dim, cx + dx, cz + dz) === 0) yield* terrainJob(dim, cx + dx, cz + dz); })(), "t" + dx + "," + dz, true);
    }
    for (const [dx, dz] of OFFSETS_DECOR) {
      if (chunkState(dim, cx + dx, cz + dz) === 1) await runExclusive((function* () { if (chunkState(dim, cx + dx, cz + dz) === 1) yield* decorateJob(dim, cx + dx, cz + dz); })(), "d" + dx + "," + dz, true);
    }
  } catch (e) {
    releaseLoadedArea(id);
    throw e;
  }
  return id;
}

const travelling = new Set(); // player ids currently being sent to Hell
const ORIGIN_PROP = "dbe:hell_origin";

/** Remembers where (dimension, exact position, facing) the player left for Hell. Saved with the player. */
function rememberOrigin(player) {
  if (player.dimension.id === DIM_ID) return;
  try {
    const { x, y, z } = player.location;
    const r = player.getRotation();
    player.setDynamicProperty(ORIGIN_PROP, JSON.stringify({ d: player.dimension.id, x, y, z, rx: r.x, ry: r.y }));
  } catch (e) {
    console.warn("[Hell] could not remember origin: " + e);
  }
}

async function sendToHell(player, fall = false) {
  if (travelling.has(player.id)) return;
  travelling.add(player.id);
  let areaId = null;
  let phase = "origin";
  try {
    if (player.dimension.id === DIM_ID) return;
    phase = "lookup";
    const dim = world.getDimension(DIM_ID);
    phase = "generation";
    const origin = travelOrigin(player);
    if (fall) {
      // slow falling first, so the player survives the drop while the chunks below are built; the way back
      // is the Other World arrival point, not the spot in the void they fell from
      try {
        player.addEffect("slow_falling", 20 * 60, { amplifier: 0, showParticles: false });
        player.setDynamicProperty(ORIGIN_PROP, JSON.stringify({ d: OTHER_WORLD.dim, ...OTHER_WORLD.returnTo, rx: 0, ry: 0 }));
      } catch (e) {
        /* ignore */
      }
      player.sendMessage("§4You fell off the Other World... straight down into Hell!");
    } else {
      rememberOrigin(player);
      player.sendMessage("§4Descending into Hell...");
    }
    areaId = await prepareArea(dim, chunkOf(SPAWN.x), chunkOf(SPAWN.z));
    phase = "teleport";
    await safeTeleport(player, fall ? { x: SPAWN.x, y: FALL_START_Y, z: SPAWN.z } : SPAWN, { origin, requireGround: !fall, dimension: dim, rotation: { x: fall ? 90 : 0, y: 180 } });
    if (areaId) await waitTicks(100); // keep the chunks loaded while the player arrives
  } catch (e) {
    reportTravelFailure(player, "Hell", e, DIM_ID, phase);
  } finally {
    if (areaId) removeArea(areaId);
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
        label: "Hell saved return",
      });
    } else {
      await safeReturnToEarth(player, { savedOrigin, label: "Hell return to Earth" });
    }
    phase = "teleport";
    if (raw !== undefined) player.setDynamicProperty(ORIGIN_PROP, undefined);
    player.sendMessage("\u00a7aYou escaped from Hell.");
  } catch (error) {
    reportTravelFailure(player, "Hell return", error, destinationId, phase);
  } finally { travelling.delete(player.id); }
}

// ---------------------------------------------------------------- setup

try {
  // dimensions/hell.json owns the native dimension definition and its biome/height settings.

  world.afterEvents.worldLoad.subscribe(() => {
    system.runInterval(() => {
      try {
        scan();
      } catch (e) {
        console.warn("[Hell] scan error: " + e);
      }
    }, SCAN_TICKS);

    system.afterEvents.scriptEventReceive.subscribe((ev) => {
      const src = ev.sourceEntity;
      if (!src || src.typeId !== "minecraft:player") return;
      if (ev.id === "dbe:hell") sendToHell(src);
      else if (ev.id === "dbe:hell_return") sendHome(src);
    });
  });
} catch (e) {
  console.warn("[Hell] setup failed: " + e);
}
