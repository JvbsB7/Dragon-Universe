import { acquireLoadedArea, releaseLoadedArea, safeTeleport, safeReturnToEarth, travelOrigin, reportTravelFailure, physicalDestinationId } from "./travel_safety.js";
import { fillAirColumn, emptyChunk, runTerrainJob, registerTerrainRepair, registerTerrainOwnership } from "./terrain_repair.js";
/**
 * Kaioshin dimension (dbe:kai)  -  the lush Kaioshin planet from Dragon Ball Z
 *
 * Bright green terraces, tall grass-capped rock pillars with striped brown cliffs, wide blue rivers that
 * tumble down the terrace steps as waterfalls, round broadleaf trees, giant lily-pad platforms with pink bulbs,
 * a magenta sky and huge translucent bubble "planets" floating overhead.
 *
 * Custom dimensions only support the void generator, so (like Namek) the planet is built by this script,
 * chunk by chunk, around players. Terrain is deterministic (fixed seed). A marker row in the bottom bedrock
 * layer of each chunk records whether it was already generated / decorated, so chunks are never generated
 * twice and player builds are never overwritten.
 *
 * Only vanilla blocks are used; the colours (grass, leaves, water, sky, fog) come from the client biome in the
 * resource pack (biomes/kaioshin.client_biome.json + fogs/kaioshin_fog_setting.json).
 *
 * Kaioshin is also a planet in space: a green-and-pink sphere orbits the Orbital Station (space_planets.js). Fly into it,
 * pick "Planet Kaioshin" in the Star Navigator or use /scriptevent dbe:space kaioshin. Fly up to y >= 500 on Kaioshin to go back to
 * the Orbital Station; "dbe:kaioshin_return" takes you home (the spot you left Earth from).
 *
 * Travel (operators / cheats enabled):
 *   /scriptevent dbe:kaioshin          -> go to Kaioshin (remembers where you left from)
 *   /scriptevent dbe:kaioshin_return   -> go back to that spot (or your spawn point)
 *   /scriptevent dbe:kaioshin_sky      -> rebuild the sky bubbles
 */
import * as mc from "@minecraft/server";
import { isSpaceDimension } from "./space_planets.js"; // loads the space system too (Kaioshin is a planet in orbit around the Orbital Station)

const { world, system, BlockVolume } = mc;

const DIM_ID = "dbe:kai"; // Physical saved-world ID; changing it would create another dimension.
const MIN_Y = -64;
const TERRAIN_RADIUS = 3; // chunks generated around each player
const DECOR_RADIUS = 2; // chunks decorated around each player (needs generated neighbours)
const SCAN_TICKS = 4;
const SEED = 0x4b4149;

// These persisted fog/property IDs remain stable for existing worlds and players.
const FOG_PUSH = "fog @s push dbe:fog_kai dbe_kai";
const FOG_POP = "fog @s remove dbe_kai";
const ORIGIN_PROP = "dbe:kai_origin";
const PROP_SKY = "dbe:kai_sky_version";
const SKY_VERSION = 1;

const STONE = "minecraft:stone";
const GRASS = "minecraft:grass_block";
const DIRT = "minecraft:dirt";
const SAND = "minecraft:sand";
const WATER = "minecraft:water";
const AIR = "minecraft:air";

// striped brown cliffs, and a pinkish variant for some regions (the far cliffs in the reference)
const ROCK = [
  "minecraft:brown_terracotta",
  "minecraft:packed_mud",
  "minecraft:hardened_clay",
  "minecraft:packed_mud",
  "minecraft:brown_terracotta",
  "minecraft:hardened_clay",
];
const ROCK_PINK = ["minecraft:pink_terracotta", "minecraft:magenta_terracotta", "minecraft:purple_terracotta", "minecraft:pink_terracotta"];

// Floating bubbles, relative to the spawn point (the spawn faces north, so +x is on the right)
const BUBBLES = [
  { dx: 70, dz: -230, y: 232, r: 26, glass: "minecraft:pink_stained_glass" },
  { dx: -150, dz: -250, y: 262, r: 12, glass: "minecraft:white_stained_glass" },
  { dx: 190, dz: -170, y: 250, r: 9, glass: "minecraft:pink_stained_glass" },
  { dx: -50, dz: -180, y: 282, r: 7, glass: "minecraft:white_stained_glass" },
  { dx: 140, dz: -310, y: 272, r: 14, glass: "minecraft:white_stained_glass" },
];

// ---------------------------------------------------------------- helpers

const chunkOf = (v) => Math.floor(v / 16);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const waitTicks = (n) => new Promise((resolve) => system.runTimeout(resolve, n));

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

const smooth = (t) => t * t * (3 - 2 * t);

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

// ---------------------------------------------------------------- terrain shape

const RIVER_W = 0.03; // half width of a river, in noise units (rivers are the 0.5 contour of a noise field)
const PCELL = 96; // one rock pillar at most per cell of PCELL x PCELL blocks

const pillarCache = new Map();

function pillarCell(ci, cj) {
  const k = ci + "," + cj;
  if (pillarCache.has(k)) return pillarCache.get(k);
  let p = null;
  if (hash2(ci * 31 + 7, cj * 17 + 3) < 0.55) {
    p = {
      x: (ci + 0.2 + 0.6 * hash2(ci * 5 + 1, cj * 9 + 2)) * PCELL,
      z: (cj + 0.2 + 0.6 * hash2(ci * 11 + 4, cj * 3 + 8)) * PCELL,
      r: 12 + 13 * hash2(ci * 13 + 9, cj * 7 + 6),
      h: 28 + 46 * hash2(ci * 3 + 5, cj * 19 + 1),
    };
  }
  pillarCache.set(k, p);
  return p;
}

/** Extra height of the tall round-topped rock pillars (0 away from them). Near-vertical sides. */
function pillarAt(x, z) {
  const ci0 = Math.floor(x / PCELL);
  const cj0 = Math.floor(z / PCELL);
  let best = 0;
  for (let ci = ci0 - 1; ci <= ci0 + 1; ci++) {
    for (let cj = cj0 - 1; cj <= cj0 + 1; cj++) {
      const p = pillarCell(ci, cj);
      if (!p) continue;
      const u = Math.hypot(x - p.x, z - p.z) / p.r;
      if (u >= 1) continue;
      const v = p.h * Math.sqrt(1 - u * u * u * u) * (1 - 0.12 * u * u);
      if (v > best) best = v;
    }
  }
  return best;
}

/** Stepped terrace index: 0..4, with a short steep ramp (the cliff) between two terraces. */
function terrace(x, z) {
  const n = fbm(x / 260 + 11, z / 260 - 5, 3);
  const t = clamp(((n - 0.3) / 0.4) * 4, 0, 3.999);
  const i = Math.floor(t);
  const f = t - i;
  return i + smooth(clamp((f - 0.9) / 0.08, 0, 1));
}

const riverNoise = (x, z) => Math.abs(fbm(x / 200 + 40, z / 200 + 90, 3) - 0.5);

/** Surface height (top block) at a world column. For river columns this is the bank level. */
function heightAt(x, z) {
  const w = riverNoise(x, z);
  const calm = clamp((w - RIVER_W) / 0.025, 0, 1); // 0 in / next to a river: flat banks, calm water
  const small = (fbm(x / 36 + 100, z / 36 - 100, 2) - 0.5) * 5 * calm;
  return clamp(Math.floor(64 + terrace(x, z) * 14 + small + pillarAt(x, z)), 40, 200);
}

function isRiver(x, z) {
  return riverNoise(x, z) < RIVER_W && pillarAt(x, z) < 1.5;
}

function rockAt(x, z) {
  const pink = fbm(x / 90 + 300, z / 90 + 300, 2) > 0.64;
  const pal = pink ? ROCK_PINK : ROCK;
  // 2 x 2 wide vertical streaks
  return pal[Math.floor(hash2(Math.floor(x / 2) * 3 + 17, Math.floor(z / 2) * 3 + 5) * pal.length)];
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

// ---------------------------------------------------------------- spawn point

let spawnCache = null;

function findSpawn() {
  if (spawnCache) return spawnCache;
  const ok = (x, z) => {
    let lo = 999;
    let hi = -999;
    for (const dx of [-8, -4, 0, 4, 8]) {
      for (const dz of [-8, -4, 0, 4, 8]) {
        const h = heightAt(x + dx, z + dz);
        if (h < lo) lo = h;
        if (h > hi) hi = h;
        if (isRiver(x + dx, z + dz) || pillarAt(x + dx, z + dz) > 0) return false;
      }
    }
    return hi - lo <= 3;
  };
  for (let r = 0; r <= 800 && !spawnCache; r += 16) {
    const steps = r === 0 ? 1 : Math.max(8, Math.floor(r / 2));
    for (let a = 0; a < steps && !spawnCache; a++) {
      const ang = (a / steps) * Math.PI * 2;
      const x = Math.round(Math.cos(ang) * r);
      const z = Math.round(Math.sin(ang) * r);
      if (ok(x, z)) spawnCache = { x, y: heightAt(x, z), z };
    }
  }
  if (!spawnCache) spawnCache = { x: 0, y: heightAt(0, 0), z: 0 };
  return spawnCache;
}

const nearSpawn = (x, z) => {
  const s = findSpawn();
  return Math.abs(x - s.x) <= 4 && Math.abs(z - s.z) <= 4;
};

// ---------------------------------------------------------------- block helpers

function set(dim, x, y, z, block) {
  if (!decorationWritable(dim, x, z)) return;
  setTerrain(dim, x, y, z, block);
}

// In an interrupted, unmarked chunk only fill air. Never replace an existing player's blocks.
function setTerrain(dim, x, y, z, block) {
  checkWritable(x, z);
  const existing = dim.getBlock({ x, y, z });
  if (!existing) throw new Error("Kaioshin terrain chunk is unavailable");
  if (existing.typeId === AIR) dim.setBlockType({ x, y, z }, block);
}

function fillTerrainColumn(dim, x, z, y1, y2, block) {
  if (y2 < y1) return;
  checkWritable(x, z);
  fillAirColumn(dim, x, z, y1, y2, block);
}

/** Vertical fill in one column (ignored when empty). */
function fillCol(dim, x, z, y1, y2, block) {
  if (y2 < y1) return;
  if (!decorationWritable(dim, x, z)) return;
  checkWritable(x, z);
  fillAirColumn(dim, x, z, y1, y2, block);
}

/** fillBlocks that normalises corners and splits big volumes (one huge call is rejected). */
function fill(dim, x1, y1, z1, x2, y2, z2, block) {
  const ax = Math.min(x1, x2), bx = Math.max(x1, x2);
  const ay = Math.min(y1, y2), by = Math.max(y1, y2);
  const az = Math.min(z1, z2), bz = Math.max(z1, z2);
  for (let x = ax; x <= bx; x++) for (let z = az; z <= bz; z++) { checkWritable(x, z); fillAirColumn(dim, x, z, ay, by, block); }
}

function checkWritable(x, z) {
  if (world.getDynamicProperty?.(terrainOwnership(chunkOf(x), chunkOf(z))) === "protected") throw new Error("Kaioshin terrain is protected after a player edit; use reviewed terrain repair");
}

function decorationWritable(dim, x, z) {
  const cx = chunkOf(x), cz = chunkOf(z);
  return world.getDynamicProperty?.(terrainOwnership(cx, cz)) === "complete" && chunkState(dim, cx, cz) === 1;
}

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

  // heights with a 1 block margin (the margin is used to find cliff faces)
  const H = new Array(18 * 18);
  let minH = 999;
  for (let i = -1; i <= 16; i++) {
    for (let j = -1; j <= 16; j++) {
      const h = heightAt(x0 + i, z0 + j);
      H[(i + 1) * 18 + (j + 1)] = h;
      if (i >= 0 && i < 16 && j >= 0 && j < 16 && h < minH) minH = h;
    }
  }
  const coreTop = minH - 8;

  // Read before each unfiltered column fill so retries preserve existing blocks even in empty subchunks.
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
      if (world.getDynamicProperty?.(terrainOwnership(cx, cz)) === "protected") throw new Error("Kaioshin generation stopped after a player edit; use reviewed terrain repair");
      fillTerrainColumn(dim, x0 + i, z0 + j, MIN_Y + 1, coreTop, STONE);
    }
    yield;
  }
  yield;

  const tops = new Array(256); // y of the highest solid / water block of each column (for the safety net)
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
      if (world.getDynamicProperty?.(terrainOwnership(cx, cz)) === "protected") throw new Error("Kaioshin generation stopped after a player edit; use reviewed terrain repair");
      const x = x0 + i;
      const z = z0 + j;
      const h = H[(i + 1) * 18 + (j + 1)];
      if (isRiver(x, z)) {
        // river: sand bed 4 below the bank, water up to 1 below the bank; on terrace steps this makes waterfalls
        const bed = h - 4;
        fillTerrainColumn(dim, x, z, coreTop + 1, bed - 1, STONE);
        setTerrain(dim, x, bed, z, SAND);
        fillTerrainColumn(dim, x, z, bed + 1, h - 1, WATER);
        tops[i * 16 + j] = h - 1;
        continue;
      }
      const n1 = H[i * 18 + (j + 1)];
      const n2 = H[(i + 2) * 18 + (j + 1)];
      const n3 = H[(i + 1) * 18 + j];
      const n4 = H[(i + 1) * 18 + (j + 2)];
      const lo = Math.min(n1, n2, n3, n4, h);
      const hi = Math.max(n1, n2, n3, n4);
      const face = hi - h >= 2; // standing below a higher neighbour: a cliff face, bare rock
      const rockFrom = lo - 1; // striped rock down to just below the lowest neighbour (visible wall)
      fillTerrainColumn(dim, x, z, coreTop + 1, rockFrom - 1, STONE);
      if (face) {
        fillTerrainColumn(dim, x, z, Math.max(rockFrom, coreTop + 1), h, rockAt(x, z));
      } else {
        fillTerrainColumn(dim, x, z, Math.max(rockFrom, coreTop + 1), h - 2, rockAt(x, z));
        setTerrain(dim, x, h - 1, z, DIRT);
        setTerrain(dim, x, h, z, GRASS);
      }
      tops[i * 16 + j] = h;
    }
    yield;
  }

  // Safety net: make sure the terrain really is there before the chunk is marked as done. If it is not
  // (chunk unloaded mid-job, engine refused a fill...) throw, so the chunk is retried instead of being a hole.
  for (let column = 0; column < 256; column++) {
    const i = Math.floor(column / 16), j = column % 16;
    const x = x0 + i, z = z0 + j, top = tops[column];
    for (const span of repairColumn(x, z)) for (let y = span.from; y <= span.to; y++) {
      const block = dim.getBlock({ x, y, z }), waterLayer = span.type === WATER;
      if (!block || block.typeId === AIR || (waterLayer ? !block.isSolid && !block.isLiquid : !block.isSolid || block.isLiquid)) {
        throw new Error("Kaioshin terrain verification failed at " + x + "," + y + "," + z + " in " + dim.id + " chunk " + cx + "," + cz + "; expected " + span.type + (waterLayer ? " water layer or existing solid block" : " solid non-liquid foundation") + ", observed " + (block?.typeId ?? "unavailable") + " (solid=" + block?.isSolid + ", liquid=" + block?.isLiquid + "); core=" + (MIN_Y + 1) + ".." + top);
      }
    }
    if (column % 16 === 15) yield;
  }
  // Keep the terrain sentinel (x0,z0) untouched until every other marker write succeeds.
  // Filling the entire floor with bedrock first could incorrectly commit decoration on interruption.
  if (world.getDynamicProperty?.(terrainOwnership(cx, cz)) === "protected") throw new Error("Kaioshin generation stopped after a player edit");
  dim.fillBlocks(new BlockVolume({ x: x0 + 2, y: MIN_Y, z: z0 }, { x: x0 + 15, y: MIN_Y, z: z0 }), "minecraft:bedrock");
  dim.fillBlocks(new BlockVolume({ x: x0, y: MIN_Y, z: z0 + 1 }, { x: x0 + 15, y: MIN_Y, z: z0 + 15 }), "minecraft:bedrock");
  dim.setBlockType({ x: x0 + 1, y: MIN_Y, z: z0 }, STONE);
  dim.setBlockType({ x: x0, y: MIN_Y, z: z0 }, "minecraft:bedrock");
}

const terrainOwnership = (cx, cz) => "dbe:kai_terrain_v2:" + cx + "," + cz;
function* ownedTerrainJob(dim, cx, cz) {
  const state = world.getDynamicProperty(terrainOwnership(cx, cz));
  if (["legacy", "complete", "protected"].includes(state)) return;
  if (state !== "building") {
    world.setDynamicProperty(terrainOwnership(cx, cz), "inspecting");
    if (!(yield* emptyChunk(dim, cx, cz, MIN_Y, 319))) {
      if (world.getDynamicProperty(terrainOwnership(cx, cz)) !== "protected") world.setDynamicProperty(terrainOwnership(cx, cz), "legacy");
      console.warn("[Kaioshin] Unowned nonempty chunk " + cx + "," + cz + " preserved; use a reviewed dbe:kaioshin_repair preview on a world copy");
      return;
    }
    if (world.getDynamicProperty(terrainOwnership(cx, cz)) === "protected") throw new Error("Kaioshin ownership inspection interrupted by a player edit");
    world.setDynamicProperty(terrainOwnership(cx, cz), "building");
  }
  yield* terrainJob(dim, cx, cz);
  world.setDynamicProperty(terrainOwnership(cx, cz), "complete");
}

// ---------------------------------------------------------------- decoration

/** A dry, gentle grass column: not a river, not a cliff face. Returns its height or -1. */
function grassHeight(x, z) {
  if (isRiver(x, z)) return -1;
  const h = heightAt(x, z);
  const hi = Math.max(heightAt(x + 1, z), heightAt(x - 1, z), heightAt(x, z + 1), heightAt(x, z - 1));
  return hi - h >= 2 ? -1 : h;
}

/** Round broadleaf tree standing on the grass block at y. */
function placeTree(dim, x, y, z, rng) {
  const trunk = 6 + Math.floor(rng() * 5);
  for (let i = 1; i <= trunk; i++) set(dim, x, y + i, z, "minecraft:oak_log");
  const r = 3 + Math.floor(rng() * 2); // canopy radius 3..4
  const cy = y + trunk;
  const ry = r * 0.85;
  for (let dx = -r; dx <= r; dx++) {
    for (let dz = -r; dz <= r; dz++) {
      for (let dy = -2; dy <= r; dy++) {
        const d = (dx * dx + dz * dz) / (r * r) + (dy * dy) / (ry * ry);
        if (d > 1 || (dx === 0 && dz === 0 && dy <= 0)) continue;
        if (d > 0.75 && rng() < 0.25) continue; // ragged edge
        set(dim, x + dx, cy + dy, z + dz, "minecraft:oak_leaves");
      }
    }
  }
}

/** Half buried rock clump. */
function placeBoulder(dim, x, y, z, r) {
  for (let dx = -r; dx <= r; dx++) {
    for (let dz = -r; dz <= r; dz++) {
      for (let dy = 0; dy <= r; dy++) {
        if (dx * dx + dz * dz + dy * dy * 1.6 <= r * r + 1) set(dim, x + dx, y + dy, z + dz, rockAt(x + dx, z + dz));
      }
    }
  }
}

/** Giant lily pad: a stalk standing in the river with a round green platform on top. */
function placeLilyPad(dim, x, bed, top, z, rng) {
  const k = 3 + Math.floor(rng() * 3);
  const padY = top + k;
  fillCol(dim, x, z, bed + 1, padY - 1, "minecraft:green_terracotta");
  const r = 3 + Math.floor(rng() * 2);
  for (let dx = -r; dx <= r; dx++) {
    for (let dz = -r; dz <= r; dz++) {
      const d2 = dx * dx + dz * dz;
      if (d2 > r * r + 1) continue;
      set(dim, x + dx, padY, z + dz, d2 > (r - 1) * (r - 1) ? "minecraft:lime_terracotta" : "minecraft:green_concrete");
    }
  }
}

/** Pink bulb on a thin stalk. */
function placeBulb(dim, x, bed, top, z, rng) {
  const t = top + 2 + Math.floor(rng() * 2);
  fillCol(dim, x, z, bed + 1, t - 1, "minecraft:green_terracotta");
  set(dim, x, t, z, "minecraft:pink_concrete");
}

function* decorateJob(dim, cx, cz) {
  const x0 = cx * 16;
  const z0 = cz * 16;
  const rng = mulberry32(Math.imul(cx, 73856093) ^ Math.imul(cz, 19349663) ^ SEED);
  const pick = () => ({ x: x0 + Math.floor(rng() * 16), z: z0 + Math.floor(rng() * 16) });

  // trees
  for (let n = 0; n < 5; n++) {
    const p = pick();
    if (rng() > 0.5 || nearSpawn(p.x, p.z)) continue;
    const h = grassHeight(p.x, p.z);
    if (h < 0) continue;
    placeTree(dim, p.x, h, p.z, rng);
  }
  yield;

  // rocks
  for (let n = 0; n < 3; n++) {
    const p = pick();
    if (rng() > 0.45 || nearSpawn(p.x, p.z)) continue;
    const h = grassHeight(p.x, p.z);
    if (h < 0) continue;
    placeBoulder(dim, p.x, h, p.z, 1 + Math.floor(rng() * 2));
  }
  yield;

  // grass tufts
  for (let n = 0; n < 14; n++) {
    const p = pick();
    const h = grassHeight(p.x, p.z);
    if (h < 0 || nearSpawn(p.x, p.z)) continue;
    set(dim, p.x, h + 1, p.z, rng() < 0.2 ? "minecraft:fern" : "minecraft:short_grass");
  }
  yield;

  // lily pads and pink bulbs standing in the rivers
  for (let n = 0; n < 8; n++) {
    const p = pick();
    if (!isRiver(p.x, p.z)) continue;
    const h = heightAt(p.x, p.z);
    if (rng() < 0.35) placeLilyPad(dim, p.x, h - 4, h - 1, p.z, rng);
    else if (rng() < 0.7) placeBulb(dim, p.x, h - 4, h - 1, p.z, rng);
  }
  yield;

  checkWritable(x0, z0);
  dim.setBlockType({ x: x0 + 1, y: MIN_Y, z: z0 }, "minecraft:bedrock");
}

// ---------------------------------------------------------------- job runner (one chunk job at a time)

let busy = false;
let repairing = false;
const retryAt = new Map();

function runJobAsync(gen) {
  return runTerrainJob(gen, { label: "Kaioshin preparation" });
}

// chunk: { dim, cx, cz } keeps that chunk loaded for the whole job (scan jobs have no travel area around them;
// a player flying away unloaded the chunk mid-job and the job failed with "unavailable" blocks).
async function runExclusive(gen, key, strict = false, chunk) {
  if (repairing) {
    if (strict) throw new Error("Kaioshin terrain repair is active; retry after it finishes");
    return;
  }
  const deadline = system.currentTick + 600;
  while (busy) {
    if (system.currentTick >= deadline) {
      if (strict) throw new Error("Terrain preparation queue timed out");
      return;
    }
    await waitTicks(2);
  }
  if (repairing) {
    if (strict) throw new Error("Kaioshin terrain repair is active; retry after it finishes");
    return;
  }
  busy = true;
  let area;
  try {
    if (chunk) {
      const x = chunk.cx * 16, z = chunk.cz * 16;
      area = await acquireLoadedArea(chunk.dim, { x, y: MIN_Y, z }, { x: x + 15, y: MIN_Y, z: z + 15 }, "Kaioshin chunk " + key);
    }
    await runJobAsync(gen);
    retryAt.delete(key);
  } catch (e) {
    retryAt.set(key, system.currentTick + 100);
    console.warn("[Kaioshin] chunk " + key + " failed: " + e);
    if (strict) throw e;
  } finally {
    if (area) releaseLoadedArea(area);
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

const inKaioshin = new Map(); // player id -> was in Kaioshin at last scan

function scan() {
  const players = world.getPlayers();

  // fog on enter / leave
  for (const p of players) {
    const now = p.dimension.id === DIM_ID;
    if (now !== (inKaioshin.get(p.id) || false)) {
      inKaioshin.set(p.id, now);
      try {
        p.runCommand(now ? FOG_PUSH : FOG_POP);
      } catch (e) {
        /* ignore */
      }
    }
  }

  if (busy || repairing) return;
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
        p.teleport({ x, y: heightAt(Math.floor(x), Math.floor(z)) + 2, z });
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
      if (["legacy", "protected"].includes(world.getDynamicProperty(terrainOwnership(cx, cz)))) continue;
      if (chunkState(dim, cx, cz) === 0) {
        runExclusive(ownedTerrainJob(dim, cx, cz), k, false, { dim, cx, cz });
        return;
      }
    }
    for (const [dx, dz] of OFFSETS_DECOR) {
      const cx = pcx + dx;
      const cz = pcz + dz;
      const k = cx + "," + cz;
      if (!canRetry(k)) continue;
      if (chunkState(dim, cx, cz) !== 1) continue;
      if (world.getDynamicProperty(terrainOwnership(cx, cz)) !== "complete") continue;
      if (NEIGHBOURS.every(([nx, nz]) => chunkState(dim, cx + nx, cz + nz) >= 1)) {
        runExclusive(decorateJob(dim, cx, cz), "d" + k, false, { dim, cx, cz });
        return;
      }
    }
  }
}

// ---------------------------------------------------------------- sky bubbles

/** Hollow, one block thick glass ball. */
function* bubble(dim, cx, cy, cz, r, block) {
  const Ri = r - 1;
  let n = 0;
  for (let dy = -r; dy <= r; dy++) {
    for (let dz = -r; dz <= r; dz++) {
      const q = r * r - dy * dy - dz * dz;
      if (q < 0) continue;
      const outer = Math.floor(Math.sqrt(q));
      const qi = Ri * Ri - dy * dy - dz * dz;
      if (qi >= 0) {
        const inner = Math.floor(Math.sqrt(qi)) + 1;
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

async function withArea(dim, id, x1, z1, x2, z2, y, work) {
  const area = await acquireLoadedArea(dim, { x: x1, y: y, z: z1 }, { x: x2, y: y, z: z2 }, id);
  try {
    await work();
  } finally {
    releaseLoadedArea(area);
  }
}

let skyBuild = null;

function ensureSky(force = false) {
  if (!force && world.getDynamicProperty(PROP_SKY) === SKY_VERSION) return Promise.resolve();
  if (skyBuild) return skyBuild;
  skyBuild = (async () => {
    try {
      const dim = world.getDimension(DIM_ID);
      const s = findSpawn();
      for (const b of BUBBLES) {
        const cx = s.x + b.dx;
        const cz = s.z + b.dz;
        const pad = 8;
        await withArea(dim, "dbe:kaioshin_sky_" + system.currentTick, cx - b.r - pad, cz - b.r - pad, cx + b.r + pad, cz + b.r + pad, b.y, async () => {
          await runJobAsync(bubble(dim, cx, b.y, cz, b.r, b.glass));
        });
      }
      world.setDynamicProperty(PROP_SKY, SKY_VERSION);
    } catch (e) {
      console.warn("[Kaioshin] sky bubbles failed (will retry on the next visit): " + e);
    } finally {
      skyBuild = null;
    }
  })();
  return skyBuild;
}

// ---------------------------------------------------------------- travel

/** Removes a temporary ticking area; never throws (the area may already be gone). */
function removeArea(id) {
  releaseLoadedArea(id);
}

async function prepareArea(dim, cx, cz) {
  if (repairing) throw new Error("Kaioshin terrain repair is active; retry after it finishes");
  const radius = Math.min(TERRAIN_RADIUS, 1);
  const id = await acquireLoadedArea(dim,
    { x: (cx - radius) * 16, y: MIN_Y, z: (cz - radius) * 16 },
    { x: (cx + radius + 1) * 16 - 1, y: MIN_Y, z: (cz + radius + 1) * 16 - 1 },
    "Kaioshin destination preparation");
  try {
    for (const [dx, dz] of OFFSETS_TERRAIN) {
      if (Math.abs(dx) > radius || Math.abs(dz) > radius) continue;
      if (chunkState(dim, cx + dx, cz + dz) === 0) await runExclusive((function* () { if (chunkState(dim, cx + dx, cz + dz) === 0) yield* ownedTerrainJob(dim, cx + dx, cz + dz); })(), "t" + dx + "," + dz, true);
    }
    for (const [dx, dz] of OFFSETS_DECOR) {
      if (Math.abs(dx) > radius || Math.abs(dz) > radius) continue;
      if (world.getDynamicProperty(terrainOwnership(cx + dx, cz + dz)) !== "complete") continue;
      if (chunkState(dim, cx + dx, cz + dz) === 1) await runExclusive((function* () { if (chunkState(dim, cx + dx, cz + dz) === 1) yield* decorateJob(dim, cx + dx, cz + dz); })(), "d" + dx + "," + dz, true);
    }
  } catch (e) {
    releaseLoadedArea(id);
    throw e;
  }
  return id;
}

const travelling = new Set();
const lastUse = new Map();

/** Remembers where (dimension, exact position, facing) the player left for Kaioshin. Saved with the player. */
const SPACE_ORIGIN_PROP = "dbe:namek_origin"; // "where you left Earth from", kept by the space system

function rememberOrigin(player) {
  if (player.dimension.id === DIM_ID) return;
  if (isSpaceDimension(player.dimension.id) || player.dimension.id === "dbe:namek" || player.dimension.id === "dbe:universe_6_arena") {
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
    console.warn("[Kaioshin] could not remember origin: " + e);
  }
}

async function sendToKaioshin(player) {
  if (travelling.has(player.id)) return;
  if (system.currentTick - (lastUse.get(player.id) ?? -1000) < 100) return;
  lastUse.set(player.id, system.currentTick);
  travelling.add(player.id);
  let areaId = null;
  let phase = "lookup";
  try {
    const dim = world.getDimension(DIM_ID);
    phase = "generation";
    const origin = travelOrigin(player);
    const s = findSpawn();
    rememberOrigin(player);
    player.sendMessage("§dTravelling to Kaioshin Planet...");
    areaId = await prepareArea(dim, chunkOf(s.x), chunkOf(s.z));
    phase = "teleport";
    await safeTeleport(player, { x: s.x + 0.5, y: s.y + 1, z: s.z + 0.5 }, { origin, requireGround: true, dimension: dim, rotation: { x: 5, y: 180 } });
    ensureSky();
    if (areaId) await waitTicks(100); // keep the chunks loaded while the player arrives
  } catch (e) {
    lastUse.delete(player.id);
    reportTravelFailure(player, "Kaioshin", e, DIM_ID, phase);
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
    let o;
    try { o = typeof raw === "string" ? JSON.parse(raw) : null; } catch {}
    if (o && [o.x, o.y, o.z].every(Number.isFinite) && typeof o.d === "string" && physicalDestinationId(o.d) !== DIM_ID) {
      if (o.d === "minecraft:overworld") await safeReturnToEarth(player, { savedOrigin: o, label: "Kaioshin return" });
      else {
        destinationId = physicalDestinationId(o.d);
        phase = "lookup";
        const dimension = world.getDimension(destinationId);
        phase = "teleport";
        await safeTeleport(player, { x: o.x, y: o.y, z: o.z }, { requireGround: true, dimension, rotation: { x: o.rx ?? 0, y: o.ry ?? 0 } });
      }
      phase = "teleport";
      player.setDynamicProperty(ORIGIN_PROP, undefined);
      player.sendMessage("§aYou are back from Kaioshin Planet.");
      return;
    }
    let spaceOrigin;
    try { spaceOrigin = JSON.parse(player.getDynamicProperty(SPACE_ORIGIN_PROP)); } catch {}
    await safeReturnToEarth(player, { savedOrigin: spaceOrigin, label: "Kaioshin return to Earth" });
    phase = "teleport";
    if (raw !== undefined) player.setDynamicProperty(ORIGIN_PROP, undefined);
    if (spaceOrigin?.d === "minecraft:overworld") player.setDynamicProperty(SPACE_ORIGIN_PROP, undefined);
    player.sendMessage("§aYou are back from Kaioshin Planet.");
  } catch (e) {
    reportTravelFailure(player, "Kaioshin return", e, destinationId, phase);
  } finally { travelling.delete(player.id); }
}

// ---------------------------------------------------------------- setup

try {
  // dimensions/kaioshin.json owns the native dimension definition, including its legacy dbe:kai ID.

  world.afterEvents.worldLoad.subscribe(() => {
    system.runInterval(() => {
      try {
        scan();
      } catch (e) {
        console.warn("[Kaioshin] scan error: " + e);
      }
    }, SCAN_TICKS);

    system.afterEvents.scriptEventReceive.subscribe((ev) => {
      const src = ev.sourceEntity;
      if (!src || src.typeId !== "minecraft:player") return;
      if (ev.id === "dbe:kai" || ev.id === "dbe:kaioshin") sendToKaioshin(src);
      else if (ev.id === "dbe:kai_return" || ev.id === "dbe:kaioshin_return") sendHome(src);
      else if (ev.id === "dbe:kai_sky" || ev.id === "dbe:kaioshin_sky") ensureSky(true);
    });
  });
} catch (e) {
  console.warn("[Kaioshin] setup failed: " + e);
}

// exposed for offline testing of the terrain shape
const repairCore = new Map();
function repairColumn(x, z) {
  const cx = chunkOf(x), cz = chunkOf(z), key = cx + "," + cz;
  let coreTop = repairCore.get(key);
  if (coreTop === undefined) {
    let min = Infinity;
    for (let dx = 0; dx < 16; dx++) for (let dz = 0; dz < 16; dz++) min = Math.min(min, heightAt(cx * 16 + dx, cz * 16 + dz));
    coreTop = min - 8;
    repairCore.set(key, coreTop);
  }
  const h = heightAt(x, z);
  if (isRiver(x, z)) return [
    { from: MIN_Y + 1, to: h - 5, type: STONE },
    { from: h - 4, to: h - 4, type: SAND },
    { from: h - 3, to: h - 1, type: WATER },
  ];
  const neighbours = [heightAt(x - 1, z), heightAt(x + 1, z), heightAt(x, z - 1), heightAt(x, z + 1)];
  const lo = Math.min(h, ...neighbours), face = Math.max(...neighbours) - h >= 2;
  const rockFrom = Math.max(lo - 1, coreTop + 1);
  const spans = [{ from: MIN_Y + 1, to: rockFrom - 1, type: STONE }, { from: rockFrom, to: face ? h : h - 2, type: rockAt(x, z) }];
  if (!face) spans.push({ from: h - 1, to: h - 1, type: DIRT }, { from: h, to: h, type: GRASS });
  return spans;
}

registerTerrainRepair({
  eventId: "dbe:kaioshin_repair", dimensionId: DIM_ID, minY: MIN_Y, maxY: 319,
  natural: new Set([AIR, STONE, GRASS, DIRT, SAND, WATER, "minecraft:bedrock", ...ROCK, ...ROCK_PINK,
    "minecraft:oak_log", "minecraft:oak_leaves", "minecraft:short_grass", "minecraft:fern", "minecraft:green_terracotta", "minecraft:lime_terracotta", "minecraft:green_concrete", "minecraft:pink_concrete",
    "minecraft:pink_stained_glass", "minecraft:white_stained_glass"]),
  column: repairColumn,
  async lock() {
    if (repairing) throw new Error("Kaioshin repair is already running");
    repairing = true;
    const deadline = system.currentTick + 600;
    try {
      while (busy) { if (system.currentTick >= deadline) throw new Error("Kaioshin generation is busy; retry repair later"); await waitTicks(1); }
      return () => { repairing = false; };
    } catch (error) { repairing = false; throw error; }
  },
}, ["dbe:kai_repair"]);
registerTerrainOwnership(DIM_ID, terrainOwnership);

export const __kaioshinTerrain = { heightAt, isRiver, pillarAt, findSpawn, rockAt, terrace, terrainJob, ownedTerrainJob, decorateJob, chunkState, repairColumn };
