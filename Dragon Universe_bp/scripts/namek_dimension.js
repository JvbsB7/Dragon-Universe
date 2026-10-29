import { acquireLoadedArea, releaseLoadedArea, safeTeleport, travelOrigin, safeReturnToEarth, reportTravelFailure, physicalDestinationId } from "./travel_safety.js";
/**
 * Namek dimension (dbe:namek)
 *
 * Namek used to be an overworld biome that replaced mesa. It is now its own custom dimension.
 * Custom dimensions only support the void generator, so the planet is built by this script,
 * chunk by chunk, around players. Terrain is deterministic (fixed seed), and a marker block in
 * the bottom bedrock row of each chunk records whether it was already generated or decorated,
 * so chunks are never generated twice and player builds are never overwritten.
 *
 * Travel:
 *   Namek Space Pod (dbe:namek_space_pod, craftable, also dropped by Vegeta): use it to fly to
 *   Namek, use it again on Namek to fly back to the exact spot (and dimension) you left from.
 *   The 7 Namek dragon balls are placed by the dragon ball manager in index.js at the spots given
 *   by namekDragonBallSpot() below.
 *   Operators / cheats enabled:
 *     /scriptevent dbe:namek          -> go to Namek
 *     /scriptevent dbe:namek_return   -> go back to your spawn point in the overworld
 */
import * as mc from "@minecraft/server";
import { isSpaceDimension } from "./space_planets.js"; // loads the space system too

const { world, system, BlockVolume } = mc;

const DIM_ID = "dbe:namek";
const POD_ITEM = "dbe:namek_space_pod";
const MIN_Y = -64;
const SEA_LEVEL = 62;
const TERRAIN_RADIUS = 3; // chunks generated around each player
const DECOR_RADIUS = 2; // chunks decorated around each player (needs generated neighbours)
const SCAN_TICKS = 4;
const SEED = 0x4e4d4b;
const CORE_SLAB = 8; // layers per fillBlocks call when building the stone core of a chunk

const STONE = "dbe:namek_stone";
const GRASS = "dbe:namek_grass";
const FOG_PUSH = "fog @s push dbe:fog_namek dbe_namek";
const FOG_POP = "fog @s remove dbe_namek";

// Village (each cell of CELL x CELL chunks holds at most one village; the original worldgen
// spacing was 30 chunks)
const CELL = 9; // was 20: villages are ~2x as close together on each axis (about 4-5x as many)
const VILLAGE_CHANCE = 0.95;
const S_PLAZA = "dbe:namek_village/village_centers/meeting_point_1"; // 15 x 2 x 15
const S_STREET = "dbe:namek_village/streets/straight_1"; // 3 x 2 x 15 (runs along z)
const S_HOUSE = "dbe:namek_village/houses/namek_medium_house_1"; // 13 x 8 x 14

// ---------------------------------------------------------------- helpers

const chunkOf = (v) => Math.floor(v / 16);

function hash2(ix, iz) {
  let h = (Math.imul(ix | 0, 374761393) + Math.imul(iz | 0, 668265263) + SEED) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

function valueNoise(x, z) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const fx = smooth(x - x0);
  const fz = smooth(z - z0);
  const a = hash2(x0, z0);
  const b = hash2(x0 + 1, z0);
  const c = hash2(x0, z0 + 1);
  const d = hash2(x0 + 1, z0 + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

function fbm(x, z, octaves) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(x * freq + o * 31.7, z * freq - o * 17.3);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

/** Surface height (top grass block / sea floor) at a world column. */
function heightAt(x, z) {
  const broad = fbm(x / 120, z / 120, 4);
  const hills = fbm(x / 40 + 100, z / 40 - 100, 3);
  const h = SEA_LEVEL + 3 + (broad - 0.5) * 70 + (hills - 0.5) * 12;
  return Math.max(30, Math.min(150, Math.floor(h)));
}

// chunk offsets sorted nearest-first
function offsetsWithin(r) {
  const list = [];
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) list.push([dx, dz]);
  list.sort((p, q) => p[0] * p[0] + p[1] * p[1] - (q[0] * q[0] + q[1] * q[1]));
  return list;
}
const OFFSETS_TERRAIN = offsetsWithin(TERRAIN_RADIUS);
const OFFSETS_DECOR = offsetsWithin(DECOR_RADIUS);
const NEIGHBOURS = offsetsWithin(1).filter((o) => o[0] !== 0 || o[1] !== 0);

// ---------------------------------------------------------------- villages

const villageCache = new Map();

/** The (deterministic) village of a cell, or null. Footprint is about 31 x 45 blocks. */
function villageForCell(ci, cj) {
  const k = ci + "," + cj;
  if (villageCache.has(k)) return villageCache.get(k);
  let result = null;
  const rng = mulberry32(Math.floor(hash2(ci * 31 + 7, cj * 17 + 3) * 4294967296));
  if (rng() < VILLAGE_CHANCE) {
    for (let t = 0; t < 12 && !result; t++) {
      const cx = ci * CELL + 3 + Math.floor(rng() * (CELL - 6));
      const cz = cj * CELL + 3 + Math.floor(rng() * (CELL - 6));
      const x = cx * 16 + 8;
      const z = cz * 16 + 8;
      let lo = 999;
      let hi = -999;
      let sum = 0;
      let count = 0;
      for (const dx of [-16, -8, 0, 8, 16]) {
        for (const dz of [-23, -12, 0, 12, 23]) {
          const h = heightAt(x + dx, z + dz);
          if (h < lo) lo = h;
          if (h > hi) hi = h;
          sum += h;
          count++;
        }
      }
      // the village pad is levelled to y, so moderately sloped ground is fine
      if (lo >= SEA_LEVEL + 1 && hi - lo <= 9) result = { cx, cz, x, z, y: Math.round(sum / count) };
    }
  }
  villageCache.set(k, result);
  return result;
}

function villageInChunkCell(cx, cz) {
  return villageForCell(Math.floor(cx / CELL), Math.floor(cz / CELL));
}

function insideVillage(v, x, z) {
  return !!v && Math.abs(x - v.x) <= 18 && Math.abs(z - v.z) <= 25;
}

/** Levels the 33 x 47 pad the village stands on (cuts hills, fills dips, grass on top). */
function* levelPad(dim, v) {
  for (let x = v.x - 16; x <= v.x + 16; x++) {
    for (let z = v.z - 23; z <= v.z + 23; z++) {
      const h = heightAt(x, z);
      if (h > v.y) {
        dim.fillBlocks(new BlockVolume({ x, y: v.y + 1, z }, { x, y: h, z }), "minecraft:air");
        dim.setBlockType({ x, y: v.y, z }, GRASS);
      } else if (h < v.y) {
        dim.fillBlocks(new BlockVolume({ x, y: h, z }, { x, y: v.y - 1, z }), STONE);
        dim.setBlockType({ x, y: v.y, z }, GRASS);
      }
    }
    yield;
  }
}

// The village pieces were authored for the jigsaw generator and still contain minecraft:jigsaw
// connector blocks (offsets inside each piece). Their final state is air, so clear them after placing.
const JIGSAWS = {
  plaza: [[0, 1, 7], [7, 1, 0], [7, 1, 14], [14, 1, 7]],
  street: [[0, 1, 11], [1, 1, 0], [1, 1, 14], [2, 1, 3]],
  house: [[6, 1, 0]],
};

function placeVillage(dim, v) {
  const sm = world.structureManager;
  const put = (id, x, z, jigsaws) => {
    sm.place(id, dim, { x, y: v.y, z });
    for (const [dx, dy, dz] of jigsaws) {
      try {
        dim.setBlockType({ x: x + dx, y: v.y + dy, z: z + dz }, "minecraft:air");
      } catch (e) {
        /* ignore */
      }
    }
  };
  put(S_PLAZA, v.x - 7, v.z - 7, JIGSAWS.plaza);
  put(S_STREET, v.x - 1, v.z - 22, JIGSAWS.street);
  put(S_STREET, v.x - 1, v.z + 8, JIGSAWS.street);
  put(S_HOUSE, v.x - 15, v.z - 22, JIGSAWS.house);
  put(S_HOUSE, v.x + 3, v.z - 22, JIGSAWS.house);
  put(S_HOUSE, v.x - 15, v.z + 9, JIGSAWS.house);
  put(S_HOUSE, v.x + 3, v.z + 9, JIGSAWS.house);
}

// ---------------------------------------------------------------- spawn point

let spawnCache = null;

function findSpawn() {
  if (spawnCache) return spawnCache;
  const ok = (x, z) => {
    let lo = 999;
    let hi = -999;
    for (const dx of [-3, 0, 3]) {
      for (const dz of [-3, 0, 3]) {
        const h = heightAt(x + dx, z + dz);
        if (h < lo) lo = h;
        if (h > hi) hi = h;
      }
    }
    if (lo < SEA_LEVEL + 1 || hi - lo > 2) return false;
    const v = villageInChunkCell(chunkOf(x), chunkOf(z));
    return !insideVillage(v, x, z);
  };
  for (let r = 0; r <= 640 && !spawnCache; r += 16) {
    const steps = r === 0 ? 1 : Math.max(8, Math.floor(r / 2));
    for (let a = 0; a < steps && !spawnCache; a++) {
      const ang = (a / steps) * Math.PI * 2;
      const x = Math.round(Math.cos(ang) * r);
      const z = Math.round(Math.sin(ang) * r);
      if (ok(x, z)) spawnCache = { x, y: heightAt(x, z), z };
    }
  }
  if (!spawnCache) spawnCache = { x: 0, y: Math.max(heightAt(0, 0), SEA_LEVEL), z: 0 };
  return spawnCache;
}

const nearSpawn = (x, z) => {
  const s = findSpawn();
  return Math.abs(x - s.x) <= 4 && Math.abs(z - s.z) <= 4;
};

// ---------------------------------------------------------------- Namek dragon balls

const BALL_COUNT = 7;
const BALL_RADIUS = 1200; // balls lie within this many blocks of the world origin
const BALL_MIN_DIST = 300; // and never closer than this to each other (relaxed only if it cannot be met)
const BALL_CLEAR = 10; // trees / bushes / grass are not generated this close to a ball

let ballCache = null;

/** The 7 fixed (deterministic) dragon ball positions of Namek: on dry land, away from spawn and villages. */
function ballSpots() {
  if (ballCache) return ballCache;
  const rng = mulberry32(SEED ^ 0x0ba11);
  const spawn = findSpawn();
  const spots = [];
  let minDist = BALL_MIN_DIST;
  for (let tries = 1; spots.length < BALL_COUNT && tries <= 40000; tries++) {
    if (tries % 4000 === 0) minDist *= 0.8; // very unlikely, but never loop forever
    const ang = rng() * Math.PI * 2;
    const r = 100 + Math.sqrt(rng()) * (BALL_RADIUS - 100);
    const x = Math.round(Math.cos(ang) * r);
    const z = Math.round(Math.sin(ang) * r);
    const h = heightAt(x, z);
    if (h < SEA_LEVEL + 1) continue; // not in the sea
    if (Math.hypot(x - spawn.x, z - spawn.z) < 100) continue;
    const v = villageInChunkCell(chunkOf(x), chunkOf(z));
    if (v && Math.abs(x - v.x) <= 28 && Math.abs(z - v.z) <= 35) continue; // not in / next to a village
    if (spots.some((s) => Math.hypot(s.x - x, s.z - z) < minDist)) continue;
    spots.push({ x, y: h + 1, z });
  }
  ballCache = spots;
  return spots;
}

/**
 * Position of Namek dragon ball number `index` (0-6). Used by the dragon ball manager in index.js.
 * The chunk may not be generated yet when the ball is placed: terrain generation only ever writes up
 * to the grass layer (y - 1), so the ball block survives it.
 */
export function namekDragonBallSpot(index) {
  const s = ballSpots();
  const p = s[index % s.length];
  return { x: p.x, y: p.y, z: p.z };
}

const nearBall = (x, z) => ballSpots().some((s) => Math.abs(x - s.x) <= BALL_CLEAR && Math.abs(z - s.z) <= BALL_CLEAR);

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
  // Solid core of the whole chunk. This used to be ONE fillBlocks call (up to ~40,000 blocks on high
  // ground), which the game rejects above its volume limit, so those chunks silently never generated
  // and showed up as huge holes in the floor. It is now filled in thin slabs.
  for (let y = MIN_Y + 1; y <= minH - 4; y += CORE_SLAB) {
    const top = Math.min(y + CORE_SLAB - 1, minH - 4);
    dim.fillBlocks(new BlockVolume({ x: x0, y, z: z0 }, { x: x0 + 15, y: top, z: z0 + 15 }), STONE);
    if (((y - MIN_Y) / CORE_SLAB) % 6 === 5) yield;
  }
  yield;
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
      const h = hs[i * 16 + j];
      const x = x0 + i;
      const z = z0 + j;
      if (h < SEA_LEVEL) {
        // sea floor is stone, water above
        dim.fillBlocks(new BlockVolume({ x, y: minH - 3, z }, { x, y: h, z }), STONE);
        dim.fillBlocks(new BlockVolume({ x, y: h + 1, z }, { x, y: SEA_LEVEL, z }), "minecraft:water");
      } else {
        dim.fillBlocks(new BlockVolume({ x, y: minH - 3, z }, { x, y: h - 1, z }), STONE);
        dim.setBlockType({ x, y: h, z }, GRASS);
      }
    }
    yield;
  }
  // Safety net: make sure the terrain really is there before the chunk is marked as done. If it is
  // not (chunk unloaded mid-job, engine refused a fill...) throw, so the chunk is retried instead of
  // being left as a hole.
  for (const [i, j] of [[0, 0], [15, 0], [0, 15], [15, 15], [8, 8], [3, 12]]) {
    const h = hs[i * 16 + j];
    const want = h < SEA_LEVEL ? "minecraft:water" : GRASS;
    const at = h < SEA_LEVEL ? SEA_LEVEL : h;
    const b = dim.getBlock({ x: x0 + i, y: at, z: z0 + j });
    const core = dim.getBlock({ x: x0 + i, y: MIN_Y + 1, z: z0 + j });
    if (!b || b.typeId !== want || !core || core.typeId !== STONE) {
      throw new Error("terrain verification failed in chunk " + cx + "," + cz);
    }
  }
  // markers (written last): bedrock floor = terrain done; x0+1 is stone until decorated
  dim.fillBlocks(new BlockVolume({ x: x0, y: MIN_Y, z: z0 }, { x: x0 + 15, y: MIN_Y, z: z0 + 15 }), "minecraft:bedrock");
  dim.setBlockType({ x: x0 + 1, y: MIN_Y, z: z0 }, STONE);
}

function* decorateJob(dim, cx, cz) {
  const x0 = cx * 16;
  const z0 = cz * 16;
  const rng = mulberry32(Math.imul(cx, 73856093) ^ Math.imul(cz, 19349663) ^ SEED);
  const village = villageInChunkCell(cx, cz);
  const pick = () => ({ x: x0 + Math.floor(rng() * 16), z: z0 + Math.floor(rng() * 16) });
  const blocked = (x, z) => nearSpawn(x, z) || insideVillage(village, x, z) || nearBall(x, z);
  const place = (feature, x, z, dy) => {
    const h = heightAt(x, z);
    if (h < SEA_LEVEL || blocked(x, z)) return;
    try {
      dim.placeFeature(feature, { x, y: h + dy, z }, false);
    } catch (e) {
      /* chunk edge / unloaded: skip this one */
    }
  };

  if (village && village.cx === cx && village.cz === cz) {
    yield* levelPad(dim, village);
    placeVillage(dim, village);
    yield;
  }

  // Ajisa trees (scatter: 2 tries, 30 % each)
  for (let n = 0; n < 2; n++) {
    if (rng() < 0.3) {
      const p = pick();
      place("dbe:select_ajisa_tree_feature", p.x, p.z, 1);
    }
  }
  yield;
  // bushes
  for (let n = 0; n < 5; n++) {
    const p = pick();
    place("dbe:namek_bush_feature", p.x, p.z, 1);
  }
  yield;
  // mushrooms
  for (let n = 0; n < 3; n++) {
    const p = pick();
    place("dbe:scatter_namek_mushrooms_feature", p.x, p.z, 0);
  }
  yield;
  // tall grass
  for (let n = 0; n < 6; n++) {
    const p = pick();
    place("dbe:scatter_namek_tall_grass_feature", p.x, p.z, 0);
  }
  yield;
  // medical moss
  if (rng() < 0.09) {
    const p = pick();
    place("dbe:medical_moss_feature", p.x, p.z, 1);
  }
  // evolitium ore underground
  for (let n = 0; n < 6; n++) {
    const p = pick();
    const top = Math.min(100, heightAt(p.x, p.z) - 6);
    const y = Math.floor(MIN_Y + 4 + rng() * (top - (MIN_Y + 4)));
    try {
      dim.placeFeature("dbe:evolitium_ore_feature", { x: p.x, y, z: p.z }, false);
    } catch (e) {
      /* skip */
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
    console.warn("[Namek] chunk " + key + " failed: " + e);
    if (strict) throw e;
  } finally {
    busy = false;
    // keep generating straight away instead of waiting for the next scan tick, so fast travellers
    // (flying nimbus etc.) do not outrun the terrain
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

const inNamek = new Map(); // player id -> was in Namek at last scan

function scan() {
  const players = world.getPlayers();

  // fog on enter / leave
  for (const p of players) {
    const now = p.dimension.id === DIM_ID;
    if (now !== (inNamek.get(p.id) || false)) {
      inNamek.set(p.id, now);
      try {
        p.runCommand(now ? FOG_PUSH : FOG_POP);
      } catch (e) {
        /* ignore */
      }
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
        p.teleport({ x, y: Math.max(heightAt(Math.floor(x), Math.floor(z)), SEA_LEVEL) + 2, z });
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

/** Removes a temporary ticking area; never throws (the area may already be gone). */
function removeArea(id) {
  releaseLoadedArea(id);
}

async function prepareArea(dim, cx, cz) {
  const id = await acquireLoadedArea(dim,
    { x: (cx - TERRAIN_RADIUS) * 16, y: MIN_Y, z: (cz - TERRAIN_RADIUS) * 16 },
    { x: (cx + TERRAIN_RADIUS + 1) * 16 - 1, y: MIN_Y, z: (cz + TERRAIN_RADIUS + 1) * 16 - 1 },
    "namek_dimension.js: destination preparation");
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

const travelling = new Set(); // player ids currently being sent to Namek
const lastPodUse = new Map(); // player id -> tick of last accepted pod use (ignores double fires)

async function sendToNamek(player) {
  if (travelling.has(player.id)) return;
  travelling.add(player.id);
  let areaId = null;
  let phase = "lookup";
  try {
    const dim = world.getDimension(DIM_ID);
    phase = "generation";
    const origin = travelOrigin(player);
    const s = findSpawn();
    rememberOrigin(player); // so the pod can bring the player back to this exact spot
    player.sendMessage("§aTravelling to Namek...");
    areaId = await prepareArea(dim, chunkOf(s.x), chunkOf(s.z));
    phase = "teleport";
    await safeTeleport(player, { x: s.x + 0.5, y: s.y + 1, z: s.z + 0.5 }, { origin, requireGround: true, dimension: dim });
    lastPodUse.set(player.id, system.currentTick);
    if (areaId) await waitTicks(100); // keep the chunks loaded while the player arrives
  } catch (e) {
    reportTravelFailure(player, "Namek", e, DIM_ID, phase);
  } finally {
    if (areaId) removeArea(areaId);
    travelling.delete(player.id);
  }
}

const ORIGIN_PROP = "dbe:namek_origin";
const OFF_WORLD_IDS = ["dbe:kai", "dbe:universe_6_arena"]; // planets reached through space, never a "home"

/** Remembers where (dimension, exact position, facing) the player left for Namek. Saved with the player. */
function rememberOrigin(player) {
  // never overwrite the origin with a spot on another planet: when leaving Kai or the arena through space,
  // space_planets.js has already copied the real home spot into this property
  if (player.dimension.id === DIM_ID || isSpaceDimension(player.dimension.id) || OFF_WORLD_IDS.includes(player.dimension.id)) return;
  try {
    const { x, y, z } = player.location;
    const r = player.getRotation();
    player.setDynamicProperty(ORIGIN_PROP, JSON.stringify({ d: player.dimension.id, x, y, z, rx: r.x, ry: r.y }));
  } catch (e) {
    console.warn("[Namek] could not remember origin: " + e);
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
        label: "Namek saved return",
      });
    } else {
      await safeReturnToEarth(player, { savedOrigin, label: "Namek return to Earth" });
    }
    phase = "teleport";
    if (raw !== undefined) player.setDynamicProperty(ORIGIN_PROP, undefined);
    player.sendMessage("\u00a7aYou are back from Namek.");
  } catch (error) {
    reportTravelFailure(player, "Namek return", error, destinationId, phase);
  } finally { travelling.delete(player.id); }
}

// ---------------------------------------------------------------- setup

try {
  // dimensions/namek.json owns the native dimension definition and its biome/height settings.

  world.afterEvents.worldLoad.subscribe(() => {
    system.runInterval(() => {
      try {
        scan();
      } catch (e) {
        console.warn("[Namek] scan error: " + e);
      }
    }, SCAN_TICKS);

    world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
      if (!itemStack || itemStack.typeId !== POD_ITEM) return;
      if (system.currentTick - (lastPodUse.get(source.id) ?? -1000) < 100) return;
      lastPodUse.set(source.id, system.currentTick);
      const here = source.dimension.id;
      if (here === DIM_ID) sendHome(source);
      else sendToNamek(source);
    });

    system.afterEvents.scriptEventReceive.subscribe((ev) => {
      const src = ev.sourceEntity;
      if (!src || src.typeId !== "minecraft:player") return;
      if (ev.id === "dbe:namek") sendToNamek(src);
      else if (ev.id === "dbe:namek_return") sendHome(src);
    });
  });
} catch (e) {
  console.warn("[Namek] setup failed: " + e);
}


// ---------------------------------------------------------------- village residents
// Namek villages used to be empty. Every village now gets a few Namekians (persistent, so they never despawn),
// spawned once per village the first time a player is close to it. Works for villages that were already built.
const RESIDENTS = 5;
const RESIDENT_OFFSETS = [[0, 3], [4, -3], [-4, -3], [5, 4], [-5, 4], [0, -5]];

function populateVillages() {
  let dim;
  try {
    dim = world.getDimension(DIM_ID);
  } catch (e) {
    return;
  }
  for (const player of dim.getPlayers()) {
    const loc = player.location;
    const v = villageInChunkCell(chunkOf(loc.x), chunkOf(loc.z));
    if (!v) continue;
    if (Math.hypot(loc.x - v.x, loc.z - v.z) > 40) continue;
    const key = "dbe_namek_residents_" + v.cx + "_" + v.cz;
    try {
      if (world.getDynamicProperty(key)) continue;
      const floor = dim.getBlock({ x: v.x, y: v.y, z: v.z });
      if (!floor || floor.isAir) continue; // pad not built yet, try again later
      let spawned = 0;
      for (let i = 0; i < RESIDENTS; i++) {
        const [dx, dz] = RESIDENT_OFFSETS[i % RESIDENT_OFFSETS.length];
        try {
          dim.spawnEntity("dbe:namekian<dbe:make_persistent>", { x: v.x + dx + 0.5, y: v.y + 2, z: v.z + dz + 0.5 });
          spawned++;
        } catch (e) {
          /* chunk not ready: leave the flag unset so we retry */
        }
      }
      if (spawned > 0) world.setDynamicProperty(key, true);
    } catch (e) {
      /* ignore */
    }
  }
}

system.runInterval(populateVillages, 100);
