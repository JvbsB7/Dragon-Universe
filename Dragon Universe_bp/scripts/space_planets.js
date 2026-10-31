import { acquireLoadedArea, releaseLoadedArea, safeTeleport, travelOrigin, isTravelPending, safeReturnToEarth, reportTravelFailure, isSafeStanding } from "./travel_safety.js";
import { fillAirColumn, emptyChunk, findUnexpectedBlock, queriesReportAir, runTerrainJob, registerTerrainOwnership, registerTerrainRepair } from "./terrain_repair.js";
/**
 * Space system: Orbital Station + extra planets (Vegeta, Frieza Planet, Yardrat, Kaioshin).
 *
 * Every world here is a custom void dimension that this script builds chunk by chunk around the
 * players (same technique as namek_dimension.js: deterministic terrain, a marker row in the bottom
 * bedrock layer says whether a chunk was already generated / decorated, player builds are never
 * overwritten).
 *
 *   dbe:space          Orbital Station: a glass-domed saucer at the centre of a small "solar system".
 *                      Planet spheres orbit around it (Earth, Namek, Vegeta, Frieza Planet,
 *                      Yardrat, Universe 6 Arena, Kaioshin). Fly into one to travel there. Asteroids float further out.
 *   dbe:vegeta         Red cratered wasteland with lava lakes.
 *   dbe:frieza_planet  Violet mesas, crystal spires and Frieza Force outposts.
 *   dbe:yardrat        Pink sea world with blossom trees and white domes.
 *   dbe:kai            Kaioshin's lush planet (kaioshin_dimension.js). Also a planet sphere in space: fly into it to land
 *                      on Kaioshin, fly up to y >= 500 there to return to the Orbital Station.
 *   dbe:universe_6_arena  Tournament of Destroyers arena (universe_6_dimension.js). Also a planet sphere in space: fly
 *                      into it to land in the arena, fly up to y >= 500 there to return to the Orbital Station.
 *
 * Villages (planet_villages.js): Vegeta = hostile Saiyan villagers, Frieza Planet = hostile Frieza-race villagers,
 * Yardrat = peaceful Yardrat villagers that fight back when attacked.
 *
 * Travel
 *   Star Navigator (dbe:star_navigator, craftable): use it to open a destination menu.
 *   Operators / cheats enabled:
 *     /scriptevent dbe:space <earth|space|namek|vegeta|frieza|yardrat|universe6|kaioshin>
 *
 * Saiyan Pod (dbe:saiyan_pod, craftable, dropped by Saiyans): a round Saiyan attack ball that works exactly like the Space Pod.
 * Space Pod (dbe:space_pod, craftable): place it, sit in and fly. It is fast and
 * goes with you when you enter a planet or leave the atmosphere. Planets are ~240 blocks from the station.
 *
 * Atmosphere exit: fly up to y >= 500 on Earth, Namek or any planet here and you are taken to the Orbital
 * Station (LAUNCH_Y). Your return point is the ground under you, never the sky.
 *
 * Every trip remembers where you left from (shared with the Namek Space Pod), "Earth" brings you back
 * to that exact spot.
 */
import * as mc from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { initVillages } from "./planet_villages.js";

const { world, system, BlockVolume } = mc;

const MIN_Y = -64;
const SCAN_TICKS = 4;
const ORIGIN_PROP = "dbe:namek_origin"; // shared with namek_dimension.js
const NAMEK_ID = "dbe:namek";
const U6_ID = "dbe:universe_6_arena"; // Tournament of Destroyers arena, handled by universe_6_dimension.js
const U6_KEY = "universe6";
const KAIOSHIN_ID = "dbe:kai"; // Kaioshin planet, handled by kaioshin_dimension.js
const KAIOSHIN_KEY = "kaioshin";
const NAVIGATOR_ITEM = "dbe:star_navigator";
const POD_ID = "dbe:space_pod"; // rideable Space Pod: fast, travels with you between worlds
const SAIYAN_POD_ID = "dbe:saiyan_pod"; // Saiyan Pod: same rules as the Space Pod, a faster round ship
const POD_IDS = [POD_ID, SAIYAN_POD_ID];
const LAUNCH_Y = 500; // fly this high on any world and you leave the atmosphere for the Orbital Station
const LAUNCH_COOLDOWN = 400;
const AIR = "minecraft:air";
const BEDROCK = "minecraft:bedrock";

// ---------------------------------------------------------------- helpers

const chunkOf = (v) => Math.floor(v / 16);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function hash2(ix, iz, seed) {
  let h = (Math.imul(ix | 0, 374761393) + Math.imul(iz | 0, 668265263) + (seed | 0)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function hash3(ix, iy, iz, seed) {
  let h = (Math.imul(ix | 0, 374761393) + Math.imul(iy | 0, 1103515245) + Math.imul(iz | 0, 668265263) + (seed | 0)) | 0;
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

function valueNoise2(x, z, seed) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const fx = smooth(x - x0);
  const fz = smooth(z - z0);
  const a = hash2(x0, z0, seed);
  const b = hash2(x0 + 1, z0, seed);
  const c = hash2(x0, z0 + 1, seed);
  const d = hash2(x0 + 1, z0 + 1, seed);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

function fbm2(x, z, octaves, seed) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise2(x * freq + o * 31.7, z * freq - o * 17.3, seed + o * 7919);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return sum / norm;
}

function noise3(x, y, z, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);
  const fx = smooth(x - x0);
  const fy = smooth(y - y0);
  const fz = smooth(z - z0);
  const l = (a, b, t) => a + (b - a) * t;
  const c000 = hash3(x0, y0, z0, seed);
  const c100 = hash3(x0 + 1, y0, z0, seed);
  const c010 = hash3(x0, y0 + 1, z0, seed);
  const c110 = hash3(x0 + 1, y0 + 1, z0, seed);
  const c001 = hash3(x0, y0, z0 + 1, seed);
  const c101 = hash3(x0 + 1, y0, z0 + 1, seed);
  const c011 = hash3(x0, y0 + 1, z0 + 1, seed);
  const c111 = hash3(x0 + 1, y0 + 1, z0 + 1, seed);
  return l(l(l(c000, c100, fx), l(c010, c110, fx), fy), l(l(c001, c101, fx), l(c011, c111, fx), fy), fz);
}

/** Impact craters: a bowl with a raised rim. Returns a (mostly negative) height offset. */
function craters(x, z, cell, chance, rMin, rMax, depth, seed) {
  const ci = Math.floor(x / cell);
  const cj = Math.floor(z / cell);
  let d = 0;
  for (let di = -1; di <= 1; di++) {
    for (let dj = -1; dj <= 1; dj++) {
      const i = ci + di;
      const j = cj + dj;
      if (hash2(i, j, seed) > chance) continue;
      const cx = (i + 0.15 + 0.7 * hash2(i, j, seed + 1)) * cell;
      const cz = (j + 0.15 + 0.7 * hash2(i, j, seed + 2)) * cell;
      const r = rMin + hash2(i, j, seed + 3) * (rMax - rMin);
      const t = Math.hypot(x - cx, z - cz) / r;
      const amp = depth * (0.55 + (0.45 * (r - rMin)) / Math.max(1, rMax - rMin));
      if (t < 1) d -= amp * (1 - t * t);
      else if (t < 1.3) d += amp * 0.4 * Math.sin(Math.PI * ((t - 1) / 0.3));
    }
  }
  return d;
}

function offsetsWithin(r) {
  const list = [];
  for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) list.push([dx, dz]);
  list.sort((p, q) => p[0] * p[0] + p[1] * p[1] - (q[0] * q[0] + q[1] * q[1]));
  return list;
}
const OFFSET_CACHE = new Map();
const offsets = (r) => {
  if (!OFFSET_CACHE.has(r)) OFFSET_CACHE.set(r, offsetsWithin(r));
  return OFFSET_CACHE.get(r);
};
const NEIGHBOURS = offsetsWithin(1).filter((o) => o[0] !== 0 || o[1] !== 0);

/** Required writes must fail the job; a missing branch is not completed decoration. */
function put(dim, x, y, z, id) {
  dim.setBlockType({ x, y, z }, id);
}

function fill(dim, x1, y1, z1, x2, y2, z2, id) {
  dim.fillBlocks(new BlockVolume({ x: x1, y: y1, z: z1 }, { x: x2, y: y2, z: z2 }), id);
}

function tryFill(dim, x1, y1, z1, x2, y2, z2, id) {
  fill(dim, x1, y1, z1, x2, y2, z2, id);
}

/** Lumpy sphere. */
function blob(dim, cx, cy, cz, r, id, rng) {
  const R = Math.ceil(r + 1);
  for (let dx = -R; dx <= R; dx++) {
    for (let dy = -R; dy <= R; dy++) {
      for (let dz = -R; dz <= R; dz++) {
        if (Math.hypot(dx, dy * 1.1, dz) <= r * (0.85 + 0.3 * rng())) put(dim, cx + dx, cy + dy, cz + dz, id);
      }
    }
  }
}

/** Tapered tower, y = first block above the ground. */
function spire(dim, x, y, z, h, r0, id) {
  for (let k = 0; k < h; k++) {
    const r = Math.max(0.5, r0 * (1 - k / h));
    const R = Math.ceil(r);
    for (let dx = -R; dx <= R; dx++) {
      for (let dz = -R; dz <= R; dz++) {
        if (dx * dx + dz * dz <= r * r + 0.3) put(dim, x + dx, y + k, z + dz, id);
      }
    }
  }
}

// ---------------------------------------------------------------- block safety net

/** If a custom block is missing or unusable the worlds fall back to vanilla blocks instead of staying void. */
const FALLBACK = {
  vegeta: { soil: "minecraft:red_terracotta", rock: "minecraft:granite" },
  frieza: { soil: "minecraft:purple_terracotta", rock: "minecraft:blackstone" },
  yardrat: { soil: "minecraft:pink_terracotta", rock: "minecraft:calcite" },
};

function blockExists(id) {
  try {
    if (mc.BlockTypes && typeof mc.BlockTypes.get === "function") return !!mc.BlockTypes.get(id);
    if (mc.BlockPermutation) {
      mc.BlockPermutation.resolve(id);
      return true;
    }
  } catch (e) {
    return false;
  }
  return true; // cannot check on this API version
}

const usedFallback = new Set();
function applyFallback(P, reason) {
  const fb = FALLBACK[P.key];
  if (!fb || usedFallback.has(P.key)) return false;
  usedFallback.add(P.key);
  P.top = fb.soil;
  P.sub = fb.soil;
  P.stone = fb.rock;
  P.floor = fb.rock;
  console.warn("[Space] " + P.key + ": using vanilla fallback blocks (" + reason + ")");
  return true;
}

let blocksChecked = false;
function ensureBlocks() {
  if (blocksChecked) return;
  blocksChecked = true;
  for (const P of Object.values(PLANETS)) {
    const bad = [P.top, P.sub, P.stone, P.floor].filter((id) => !blockExists(id));
    if (bad.length) applyFallback(P, "missing " + bad.join(", "));
    P.ores = P.ores.filter((o) => blockExists(o.id));
  }
  for (let i = 0; i < ASTEROID_ROCKS.length; i++) {
    if (!blockExists(ASTEROID_ROCKS[i])) ASTEROID_ROCKS[i] = "minecraft:andesite";
  }
  for (let i = 0; i < ASTEROID_ORES.length; i++) {
    if (!blockExists(ASTEROID_ORES[i])) ASTEROID_ORES[i] = "minecraft:iron_ore";
  }
}

// ---------------------------------------------------------------- loot chests

const LOOT_FALLBACK = {
  vegeta_ruins: [["dbe:senzu_bean", 1, 2], ["minecraft:iron_ingot", 3, 6], ["minecraft:gold_ingot", 2, 4], ["dbe:evolitium_crystal", 1, 2]],
  crashed_pod: [["dbe:nanochip", 1, 1], ["minecraft:iron_ingot", 2, 5], ["minecraft:redstone", 4, 8]],
  frieza_outpost: [["dbe:nanochip", 1, 3], ["minecraft:ender_pearl", 1, 3], ["dbe:evolitium_crystal", 2, 4], ["dbe:senzu_bean", 1, 3]],
  yardrat_dome: [["dbe:senzu_bean", 2, 4], ["dbe:ramen", 2, 4], ["minecraft:emerald", 1, 3]],
};

/** Places a chest and fills it from loot_tables/chests/space/<table>.json (script fallback if the command fails). */
function lootChest(dim, x, y, z, table, rng) {
  if (dim.getBlock({ x, y, z })?.typeId === "minecraft:chest") return;
  dim.setBlockType({ x, y, z }, "minecraft:chest");
  let filled = false;
  try {
    dim.runCommand("loot insert " + x + " " + y + " " + z + ' loot "chests/space/' + table + '"');
    const inv = dim.getBlock({ x, y, z })?.getComponent("minecraft:inventory")?.container;
    filled = !!inv && inv.emptySlotsCount < inv.size;
  } catch (e) {
    filled = false;
  }
  if (filled) return;
  try {
    const inv = dim.getBlock({ x, y, z })?.getComponent("minecraft:inventory")?.container;
    if (!inv) return;
    for (const [id, mn, mx] of LOOT_FALLBACK[table] ?? []) {
      inv.addItem(new mc.ItemStack(id, mn + Math.floor(rng() * (mx - mn + 1))));
    }
  } catch (e) {
    console.warn("[Space] could not fill chest: " + e);
  }
}

// ---------------------------------------------------------------- world definitions

const SPACE_Y = 120; // height of the Orbital Station deck
const SPACE_STATION = { x: 0.5, y: SPACE_Y + 1, z: 0.5 };

const ORE_STD = [
  { id: "minecraft:iron_ore", tries: 6, size: 5, minY: -40, maxY: 48 },
  { id: "minecraft:gold_ore", tries: 2, size: 4, minY: -60, maxY: 20 },
  { id: "minecraft:redstone_ore", tries: 3, size: 5, minY: -60, maxY: 16 },
  { id: "minecraft:diamond_ore", tries: 1, size: 3, minY: -60, maxY: -4 },
  { id: "dbe:deepslate_evolitium_ore", tries: 3, size: 4, minY: -60, maxY: 30 },
];

/** Decoration helpers receive a context object built by decorateJob(). */
/** 11x11 ruined fort: broken walls, four towers, a vault chest and a guard chest. */
function* saiyanRuin(c, x, z) {
  const { dim, rng } = c;
  const y = heightAt(c.P, x, z);
  yield* levelArea(c, x - 5, z - 5, x + 5, z + 5, y, "minecraft:polished_blackstone");
  tryFill(dim, x - 5, y + 1, z - 5, x + 5, y + 9, z + 5, AIR);
  const brick = () => (rng() < 0.35 ? "minecraft:cracked_polished_blackstone_bricks" : "minecraft:polished_blackstone_bricks");
  for (let k = -5; k <= 5; k++) {
    const hgt = 1 + Math.floor(rng() * 4); // broken wall tops
    for (const [wx, wz] of [[x + k, z - 5], [x + k, z + 5], [x - 5, z + k], [x + 5, z + k]]) {
      if (wz === z + 5 && Math.abs(k) <= 1) continue; // entrance
      const hh = rng() < 0.2 ? 0 : hgt;
      for (let dy = 1; dy <= hh; dy++) put(dim, wx, y + dy, wz, brick());
    }
  }
  for (const sx of [-5, 5]) for (const sz of [-5, 5]) for (let dy = 1; dy <= 5 + Math.floor(rng() * 3); dy++) put(dim, x + sx, y + dy, z + sz, brick());
  // inner vault
  tryFill(dim, x - 1, y + 1, z - 1, x + 1, y + 3, z + 1, brick());
  tryFill(dim, x, y + 1, z, x, y + 2, z, AIR);
  put(dim, x, y + 1, z + 1, AIR);
  put(dim, x, y + 2, z + 1, AIR);
  lootChest(dim, x, y + 1, z, "vegeta_ruins", rng);
  lootChest(dim, x + 3, y + 1, z + 3, "crashed_pod", rng);
  put(dim, x - 3, y + 1, z - 3, "minecraft:sea_lantern");
  yield;
}

function* vegetaDecor(c) {
  const { rng, P, dim } = c;
  // boulders
  for (let n = 0; n < 4; n++) {
    if (rng() >= 0.55) continue;
    const p = c.pick(4);
    const h = c.land(p.x, p.z);
    if (h < 0) continue;
    blob(dim, p.x, h + 1, p.z, 1.4 + rng() * 2.2, P.stone, rng);
  }
  yield;
  // jagged rock spires
  if (rng() < 0.3) {
    const p = c.pick(4);
    const h = c.land(p.x, p.z);
    if (h >= 0) spire(dim, p.x, h + 1, p.z, 8 + Math.floor(rng() * 9), 2.4 + rng() * 1.2, P.stone);
  }
  yield;
  // crashed attack pods: half-buried hollow metal spheres
  if (rng() < 0.07) {
    const p = c.pick(6);
    const h = c.land(p.x, p.z);
    if (h >= 0) {
      for (let dx = -4; dx <= 4; dx++) {
        for (let dy = -4; dy <= 4; dy++) {
          for (let dz = -4; dz <= 4; dz++) {
            const d = Math.hypot(dx, dy, dz);
            const x = p.x + dx;
            const y = h + 1 + dy;
            const z = p.z + dz;
            if (d <= 3.4 && d >= 2.4) {
              if (dy >= 2 && dx * dx + dz * dz <= 2) continue; // hatch
              put(dim, x, y, z, dy === 0 && d > 3 ? "minecraft:glass" : "minecraft:light_gray_concrete");
            } else if (d < 2.4 && dy >= -1) {
              put(dim, x, y, z, AIR);
            }
          }
        }
      }
      lootChest(dim, p.x, h, p.z, "crashed_pod", rng);
      put(dim, p.x + 1, h, p.z, "minecraft:sea_lantern");
    }
  }
  yield;
  // Saiyan ruins: crumbling blackstone fort with treasure
  if (rng() < 0.09) {
    const p = { x: c.x0 + 8, z: c.z0 + 8 };
    if (c.flat(p.x, p.z, 5, 3)) yield* saiyanRuin(c, p.x, p.z);
  }
  yield;
}

function* friezaDecor(c) {
  const { rng, P, dim } = c;
  for (let n = 0; n < 3; n++) {
    if (rng() >= 0.35) continue;
    const p = c.pick(4);
    const h = c.land(p.x, p.z);
    if (h < 0) continue;
    spire(dim, p.x, h + 1, p.z, 10 + Math.floor(rng() * 14), 1.6 + rng() * 1.2, rng() < 0.7 ? "minecraft:amethyst_block" : P.stone);
  }
  yield;
  for (let n = 0; n < 3; n++) {
    if (rng() >= 0.4) continue;
    const p = c.pick(3);
    const h = c.land(p.x, p.z);
    if (h < 0) continue;
    blob(dim, p.x, h + 1, p.z, 1.3 + rng() * 2, P.stone, rng);
  }
  yield;
  // Frieza Force outposts
  if (rng() < 0.13) {
    const p = { x: c.x0 + 8, z: c.z0 + 8 };
    if (c.flat(p.x, p.z, 5, 3)) {
      yield* outpost(c, p.x, p.z, { floor: "minecraft:purple_concrete", pillar: "minecraft:polished_blackstone_bricks", roof: "minecraft:purple_concrete", light: "minecraft:sea_lantern", loot: "frieza_outpost" });
    }
  }
}

function* yardratDecor(c) {
  const { rng, P, dim } = c;
  // blossom trees
  for (let n = 0; n < 3; n++) {
    if (rng() >= 0.45) continue;
    const p = c.pick(4);
    const h = c.land(p.x, p.z);
    if (h < 0) continue;
    const th = 4 + Math.floor(rng() * 4);
    for (let k = 1; k <= th; k++) put(dim, p.x, h + k, p.z, "minecraft:cherry_log");
    blob(dim, p.x, h + th + 1, p.z, 2.6 + rng() * 0.9, "minecraft:cherry_leaves", rng);
    blob(dim, p.x + (rng() < 0.5 ? 2 : -2), h + th, p.z + (rng() < 0.5 ? 2 : -2), 1.8, "minecraft:cherry_leaves", rng);
  }
  yield;
  for (let n = 0; n < 2; n++) {
    if (rng() >= 0.3) continue;
    const p = c.pick(3);
    const h = c.land(p.x, p.z);
    if (h < 0) continue;
    blob(dim, p.x, h + 1, p.z, 1.2 + rng() * 1.6, P.stone, rng);
  }
  yield;
  // white habitation domes
  if (rng() < 0.12) {
    const p = { x: c.x0 + 8, z: c.z0 + 8 };
    if (c.flat(p.x, p.z, 5, 2)) {
      const y = c.land(p.x, p.z);
      yield* levelArea(c, p.x - 5, p.z - 5, p.x + 5, p.z + 5, y, "minecraft:pink_concrete");
      for (let dx = -5; dx <= 5; dx++) {
        for (let dy = 0; dy <= 5; dy++) {
          for (let dz = -5; dz <= 5; dz++) {
            const d = Math.hypot(dx, dy, dz);
            const gx = p.x + dx;
            const gy = y + 1 + dy;
            const gz = p.z + dz;
            if (d <= 4.4 && d >= 3.4) {
              if (dz <= -3 && Math.abs(dx) <= 1 && dy <= 2) continue; // doorway
              put(dim, gx, gy, gz, dy === 2 && (Math.abs(dx) === 4 || Math.abs(dz) === 4) ? "minecraft:glass" : "minecraft:white_concrete");
            } else if (d < 3.4) {
              put(dim, gx, gy, gz, AIR);
            }
          }
        }
      }
      put(dim, p.x, y + 4, p.z, "minecraft:sea_lantern");
      lootChest(dim, p.x, y + 1, p.z + 1, "yardrat_dome", rng);
      yield;
    }
  }
}

const PLANETS = {
  vegeta: {
    key: "vegeta",
    id: "dbe:vegeta",
    seed: 0x5e6a,
    top: "dbe:vegeta_soil",
    sub: "dbe:vegeta_soil",
    stone: "dbe:vegeta_rock",
    floor: "dbe:vegeta_rock",
    liquid: "minecraft:lava",
    liquidLevel: 52,
    effects: [],
    ores: [...ORE_STD, { id: "minecraft:gold_ore", tries: 2, size: 4, minY: -60, maxY: 40 }],
    height(x, z) {
      const broad = fbm2(x / 150, z / 150, 4, 11);
      const hills = fbm2(x / 38 + 40, z / 38 - 40, 3, 12);
      const h = 66 + (broad - 0.5) * 58 + (hills - 0.5) * 14 + craters(x, z, 56, 0.55, 7, 20, 10, 13);
      return clamp(Math.floor(h), 24, 160);
    },
    decorate: vegetaDecor,
  },
  frieza: {
    key: "frieza",
    id: "dbe:frieza_planet",
    seed: 0x79f1,
    top: "dbe:frieza_soil",
    sub: "dbe:frieza_soil",
    stone: "dbe:frieza_rock",
    floor: "dbe:frieza_rock",
    liquid: "minecraft:water",
    liquidLevel: 58,
    effects: [],
    ores: [...ORE_STD, { id: "minecraft:lapis_ore", tries: 3, size: 5, minY: -50, maxY: 30 }],
    height(x, z) {
      const broad = fbm2(x / 170, z / 170, 4, 21);
      const detail = fbm2(x / 45 + 9, z / 45 - 9, 2, 22);
      const h = 72 + (broad - 0.5) * 70 + (detail - 0.5) * 5;
      return clamp(Math.floor(h / 6) * 6 + 1, 24, 160); // stepped mesas
    },
    decorate: friezaDecor,
  },
  yardrat: {
    key: "yardrat",
    id: "dbe:yardrat",
    seed: 0x1a2d,
    top: "dbe:yardrat_soil",
    sub: "dbe:yardrat_soil",
    stone: "dbe:yardrat_rock",
    floor: "dbe:yardrat_rock",
    liquid: "minecraft:water",
    liquidLevel: 60,
    effects: [],
    ores: [...ORE_STD, { id: "minecraft:emerald_ore", tries: 1, size: 2, minY: -40, maxY: 30 }],
    height(x, z) {
      const broad = fbm2(x / 130, z / 130, 4, 31);
      const hills = fbm2(x / 34 + 5, z / 34 - 5, 3, 32);
      const h = 64 + (broad - 0.5) * 34 + (hills - 0.5) * 9;
      return clamp(Math.floor(h), 28, 130);
    },
    decorate: yardratDecor,
  },
};

for (const P of Object.values(PLANETS)) {
  P.kind = "planet";
  P.radius = 3; // chunks generated around each player
  P.decorRadius = 2; // chunks decorated around each player
  P.fog = "dbe:fog_" + P.key;
  P.fogTag = "dbe_" + P.key;
}

const SPACE = {
  key: "space",
  id: "dbe:space",
  kind: "space",
  radius: 5,
  prep: 2,
  fog: "dbe:fog_space",
  fogTag: "dbe_space",
  effects: [{ id: "slow_falling", amp: 0 }],
};

const WORLDS = { space: SPACE, ...PLANETS };
const BY_DIM = new Map(Object.values(WORLDS).map((w) => [w.id, w]));

/** True for the dimensions created by this module (used by namek_dimension.js). */
export function isSpaceDimension(dimId) {
  return BY_DIM.has(dimId);
}

// destinations offered by the menu / script event
const DESTS = ["earth", "space", "namek", "vegeta", "frieza", "yardrat", U6_KEY, KAIOSHIN_KEY];

// ---------------------------------------------------------------- planet terrain helpers

const heightCache = new Map();
function heightAt(P, x, z) {
  return P.height(x, z);
}

const spawnCache = new Map();
function findSpawn(P) {
  if (spawnCache.has(P.key)) return spawnCache.get(P.key);
  const minDry = P.liquid ? P.liquidLevel + 2 : -999;
  const ok = (x, z) => {
    let lo = 999;
    let hi = -999;
    for (const dx of [-5, 0, 5]) {
      for (const dz of [-5, 0, 5]) {
        const h = heightAt(P, x + dx, z + dz);
        if (h < lo) lo = h;
        if (h > hi) hi = h;
      }
    }
    return lo >= minDry && hi - lo <= 2;
  };
  let found = null;
  for (let r = 0; r <= 800 && !found; r += 16) {
    const steps = r === 0 ? 1 : Math.max(8, Math.floor(r / 2));
    for (let a = 0; a < steps && !found; a++) {
      const ang = (a / steps) * Math.PI * 2;
      const x = Math.round(Math.cos(ang) * r);
      const z = Math.round(Math.sin(ang) * r);
      if (ok(x, z)) found = { x, y: heightAt(P, x, z), z };
    }
  }
  if (!found) found = { x: 0, y: Math.max(heightAt(P, 0, 0), P.liquidLevel + 1), z: 0 };
  spawnCache.set(P.key, found);
  return found;
}

const nearSpawn = (P, x, z, r) => {
  const s = findSpawn(P);
  return Math.abs(x - s.x) <= r && Math.abs(z - s.z) <= r;
};

// Planet villages (Saiyan / Frieza race / Yardrat) - see planet_villages.js
const villages = initVillages({
  heightAt: (P, x, z) => heightAt(P, x, z),
  nearSpawn: (P, x, z, r) => nearSpawn(P, x, z, r),
  hash2: (a, b, seed) => hash2(a, b, seed),
  mulberry32: (seed) => mulberry32(seed),
  blockExists: (id) => blockExists(id),
  lootChest: (dim, x, y, z, table, rng) => lootChest(dim, x, y, z, table, rng),
});

// ---------------------------------------------------------------- chunk state

const planetOwnership = (P, cx, cz) => "dbe:planet_terrain_v1:" + P.key + ":" + cx + "," + cz;
const planetBuffer = (P, cx, cz) => "dbe:planet_buffer_v1710:" + P.key + ":" + cx + "," + cz;
const BUFFER_NEIGHBORS = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]];
class PlanetPreservationError extends Error {
  constructor(message) { super(message); this.name = "PlanetPreservationError"; }
}
function planetProvenance(P, cx, cz) {
  const state = world.getDynamicProperty(planetOwnership(P, cx, cz)), buffer = world.getDynamicProperty(planetBuffer(P, cx, cz));
  const match = typeof buffer === "string" && /^building-air:(0|[1-9]\d{0,2})$/.exec(buffer);
  const progress = match && Number(match[1]) <= 256 * Math.ceil((P.liquidLevel - MIN_Y) / 64) ? Number(match[1]) : undefined;
  const knownState = state === undefined || ["inspecting", "building", "complete", "legacy", "protected"].includes(state);
  const knownBuffer = buffer === undefined || progress !== undefined || ["building", "ready", "converting", "profile", "legacy-profile"].includes(buffer);
  const bufferOwned = buffer === undefined || ["building", "complete", "protected"].includes(state);
  if (!knownState || !knownBuffer || !bufferOwned)
    throw new PlanetPreservationError(P.key + " preserves unknown terrain/buffer provenance at " + cx + "," + cz + "; review this world copy before retrying");
  return { state, buffer, progress };
}
function planetWritable(P, cx, cz, phase) {
  const state = world.getDynamicProperty(planetOwnership(P, cx, cz));
  if (state !== (phase === "terrain" ? "building" : "complete")) throw new PlanetPreservationError(P.key + " " + phase + " preserves " + (state ?? "unowned") + " chunk " + cx + "," + cz + "; review the world copy before terrain repair");
}
function planetColumn(P, x, z) {
  const h = heightAt(P, x, z), wet = P.liquid !== null && h < P.liquidLevel;
  const spans = [{ from: MIN_Y + 1, to: h - 4, type: P.stone }, { from: h - 3, to: h - 1, type: wet ? P.floor : P.sub }, { from: h, to: h, type: wet ? P.floor : P.top }];
  if (wet) spans.push({ from: h + 1, to: P.liquidLevel, type: P.liquid });
  return spans;
}
for (const P of Object.values(PLANETS)) {
  registerTerrainOwnership(P.id, (cx, cz) => planetOwnership(P, cx, cz));
  registerTerrainRepair({
    eventId: "dbe:" + P.key + "_repair", dimensionId: P.id, minY: MIN_Y, maxY: 319,
    natural: new Set([AIR, BEDROCK, P.top, P.sub, P.stone, P.floor, P.liquid, FALLBACK[P.key].soil, FALLBACK[P.key].rock].filter(Boolean)),
    column: (x, z) => planetColumn(P, x, z),
    // Explicit reviewed repair only: a bucket/imported liquid is never adopted by generation.
    replaceable: (current, expected) => current === P.liquid && [P.top, P.sub, P.stone, P.floor].includes(expected),
    async lock() {
      if (repairing) throw new Error("Another space terrain repair is active");
      repairing = true;
      try { await waitForWriter(); return () => { repairing = false; }; }
      catch (error) { repairing = false; throw error; }
    },
  });
}

/** 0 = not generated, 1 = terrain only, 2 = terrain + decoration, -1 = chunk not loaded. */
function chunkState(dim, cx, cz) {
  const x0 = cx * 16;
  const z0 = cz * 16;
  try {
    const a = dim.getBlock({ x: x0, y: MIN_Y, z: z0 });
    if (!a) return -1;
    if (a.typeId !== BEDROCK) return 0;
    const b = dim.getBlock({ x: x0 + 1, y: MIN_Y, z: z0 });
    if (!b) return -1;
    return b.typeId === BEDROCK ? 2 : 1;
  } catch (error) {
    if (/UnloadedChunksError|LocationInUnloadedChunk/.test(String(error))) return -1;
    throw error;
  }
}

// ---------------------------------------------------------------- planet generation

// Each fresh chunk first receives a versioned solid buffer up to sea level. Adjacent
// buffers contain native fluid updates while a chunk is converted to its real profile.
// A 1.7.9 building marker without this separate proof never authorizes replacement.
// Native proofs replace per-block reads in the read-only checks below; writes do not change. A generator type is only
// trusted as solid after a real read saw it solid. Anything a query cannot prove goes through the original per-block
// loop, which keeps the same verdict and error.
const provenSolid = new Map();
function learnSolid(P, block) {
  if (![P.stone, P.floor, P.sub, P.top].includes(block.typeId) || !block.isSolid || block.isLiquid) return;
  if (!provenSolid.has(P.key)) provenSolid.set(P.key, new Set());
  provenSolid.get(P.key).add(block.typeId);
}
const solidTypes = (P) => [...(provenSolid.get(P.key) ?? [])];
const queriesUsable = (dim, cx, cz) => queriesReportAir(dim, { x: cx * 16, y: 319, z: cz * 16 });
function columnContained(P, dim, x, z, strict, profile) {
  const solids = solidTypes(P);
  if (strict) return solids.includes(P.stone) && !findUnexpectedBlock(dim, { x, y: MIN_Y + 1, z }, { x, y: P.liquidLevel, z }, [P.stone]);
  if (!solids.length) return false;
  for (const span of profile) {
    const to = Math.min(span.to, P.liquidLevel);
    if (span.from > to) continue;
    if (findUnexpectedBlock(dim, { x, y: span.from, z }, { x, y: to, z }, span.type === P.liquid ? [...solids, P.liquid] : solids)) return false;
  }
  return true;
}
function columnMatchesProfile(P, dim, x, z, profile) {
  const solids = solidTypes(P);
  for (const span of profile) {
    if (span.type !== P.liquid && !solids.includes(span.type)) return false;
    if (findUnexpectedBlock(dim, { x, y: span.from, z }, { x, y: span.to, z }, [span.type])) return false;
  }
  return true;
}

let spanPace = 0;
function* fillPlanetSpan(P, dim, x, z, from, to, type) {
  const buffer = world.getDynamicProperty(planetBuffer(P, chunkOf(x), chunkOf(z)));
  const convertible = buffer === "ready" || buffer === "converting";
  const runs = []; let start;
  for (let y = from; y <= to + 1; y++) {
    const current = y <= to ? dim.getBlock({ x, y, z }) : undefined;
    if (y <= to && !current) throw new Error(P.key + " terrain unavailable at " + x + "," + y + "," + z);
    const scaffold = convertible && y <= P.liquidLevel && current?.typeId === P.stone;
    if (y <= to && current.typeId !== type) {
      if (!scaffold && (current.typeId !== AIR || convertible && y <= P.liquidLevel)) throw new PlanetPreservationError(P.key + " preserves changed buffer/profile " + current.typeId + " at " + x + "," + y + "," + z + "; required " + type);
      start ??= y; continue;
    }
    if (start !== undefined) { runs.push({ from: start, to: y - 1 }); start = undefined; }
  }
  for (const run of runs) dim.fillBlocks(new BlockVolume({ x, y: run.from, z }, { x, y: run.to, z }), type);
  if (++spanPace % 8 === 0) yield;
}

function* terrainJob(P, dim, cx, cz) {
  const x0 = cx * 16;
  const z0 = cz * 16;
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
      const x = x0 + i, z = z0 + j;
      for (const span of planetColumn(P, x, z)) for (let y = span.from; y <= span.to; y += 64) {
        planetWritable(P, cx, cz, "terrain");
        yield* fillPlanetSpan(P, dim, x, z, y, Math.min(y + 63, span.to), span.type);
      }
    }
  }
  yield* verifyPlanetProfile(P, dim, cx, cz);
}

function* verifyPlanetProfile(P, dim, cx, cz) {
  const x0 = cx * 16, z0 = cz * 16;
  const native = queriesUsable(dim, cx, cz);
  for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
    const x = x0 + i, z = z0 + j;
    if (native && columnMatchesProfile(P, dim, x, z, planetColumn(P, x, z))) {
      planetWritable(P, cx, cz, "terrain");
      if (j === 15) yield;
      continue;
    }
    for (const span of planetColumn(P, x, z)) for (let y = span.from; y <= span.to; y++) {
      const block = dim.getBlock({ x, y, z }), liquid = span.type === P.liquid;
      if (block) learnSolid(P, block);
      if (!block || block.typeId === AIR || (liquid ? !block.isSolid && !block.isLiquid : !block.isSolid || block.isLiquid)) throw new Error(P.key + " terrain verification failed at " + x + "," + y + "," + z + "; expected " + span.type + ", observed " + (block?.typeId ?? "unavailable"));
      if (block.typeId !== span.type) throw new PlanetPreservationError(P.key + " terrain preserves unexpected " + block.typeId + " at " + x + "," + y + "," + z + "; expected original profile " + span.type + "; review the world copy before repair");
      if ((y - span.from + 1) % 64 === 0 || y === span.to) { planetWritable(P, cx, cz, "terrain"); yield; }
    }
  }
}

/** Levels a rectangle to height y (cuts hills, fills dips), topped with block `topId`. */
function* levelArea(c, x1, z1, x2, z2, y, topId) {
  const { P, dim } = c;
  for (let x = x1; x <= x2; x++) {
    for (let z = z1; z <= z2; z++) {
      const h = heightAt(P, x, z);
      if (h > y) dim.fillBlocks(new BlockVolume({ x, y: y + 1, z }, { x, y: h, z }), AIR);
      else if (h < y) dim.fillBlocks(new BlockVolume({ x, y: h, z }, { x, y: y - 1, z }), P.stone);
      dim.setBlockType({ x, y, z }, topId);
    }
    yield;
  }
}

function* outpost(c, x, z, S) {
  const { dim } = c;
  const y = heightAt(c.P, x, z);
  yield* levelArea(c, x - 5, z - 5, x + 5, z + 5, y, S.floor);
  tryFill(dim, x - 5, y + 1, z - 5, x + 5, y + 8, z + 5, AIR);
  for (const sx of [-5, 5]) {
    for (const sz of [-5, 5]) tryFill(dim, x + sx, y + 1, z + sz, x + sx, y + 5, z + sz, S.pillar);
  }
  // low walls with an opening in the middle of every side
  for (let k = -5; k <= 5; k++) {
    if (Math.abs(k) <= 1) continue;
    put(dim, x + k, y + 1, z - 5, S.pillar);
    put(dim, x + k, y + 1, z + 5, S.pillar);
    put(dim, x - 5, y + 1, z + k, S.pillar);
    put(dim, x + 5, y + 1, z + k, S.pillar);
  }
  tryFill(dim, x - 5, y + 6, z - 5, x + 5, y + 6, z + 5, S.roof);
  put(dim, x, y + 5, z, S.light);
  if (S.loot) {
    lootChest(dim, x, y + 1, z, S.loot, c.rng);
    lootChest(dim, x + 3, y + 1, z - 3, S.loot, c.rng);
  }
  yield;
}

function* decorateJob(P, dim, cx, cz) {
  const x0 = cx * 16;
  const z0 = cz * 16;
  const rng = mulberry32(Math.imul(cx, 73856093) ^ Math.imul(cz, 19349663) ^ P.seed);
  const spawn = findSpawn(P);
  const dryMin = P.liquid ? P.liquidLevel + 1 : -999;
  const c = {
    P,
    dim,
    cx,
    cz,
    x0,
    z0,
    rng,
    pick: (margin = 2) => ({ x: x0 + margin + Math.floor(rng() * (16 - 2 * margin)), z: z0 + margin + Math.floor(rng() * (16 - 2 * margin)) }),
    /** surface height of a usable (dry, not on the landing pad) column, or -1 */
    land: (x, z) => {
      if (nearSpawn(P, x, z, 9)) return -1;
      if (villages.near(P, x, z, 6)) return -1;
      const h = heightAt(P, x, z);
      return h < dryMin + 1 ? -1 : h;
    },
    flat: (x, z, half, maxDiff) => {
      if (nearSpawn(P, x, z, 14)) return false;
      if (villages.near(P, x, z, 12)) return false;
      let lo = 999;
      let hi = -999;
      for (let dx = -half; dx <= half; dx += half) {
        for (let dz = -half; dz <= half; dz += half) {
          const h = heightAt(P, x + dx, z + dz);
          if (h < lo) lo = h;
          if (h > hi) hi = h;
        }
      }
      return lo >= dryMin + 2 && hi - lo <= maxDiff;
    },
  };

  // landing pad at the arrival point
  if (chunkOf(spawn.x) === cx && chunkOf(spawn.z) === cz) {
    const y = spawn.y;
    yield* levelArea(c, spawn.x - 5, spawn.z - 5, spawn.x + 5, spawn.z + 5, y, P.top);
    tryFill(dim, spawn.x - 5, y + 1, spawn.z - 5, spawn.x + 5, y + 6, spawn.z + 5, AIR);
    tryFill(dim, spawn.x - 3, y, spawn.z - 3, spawn.x + 3, y, spawn.z + 3, "minecraft:light_gray_concrete");
    tryFill(dim, spawn.x - 1, y, spawn.z - 1, spawn.x + 1, y, spawn.z + 1, "minecraft:gray_concrete");
    for (const sx of [-3, 3]) for (const sz of [-3, 3]) put(dim, spawn.x + sx, y, spawn.z + sz, "minecraft:sea_lantern");
    yield;
  }

  yield* villages.buildInChunk(c);

  yield* P.decorate(c);

  // ores
  for (const o of P.ores) {
    for (let n = 0; n < o.tries; n++) {
      const x = x0 + Math.floor(rng() * 16);
      const z = z0 + Math.floor(rng() * 16);
      const top = Math.min(o.maxY, heightAt(P, x, z) - 8);
      if (top < o.minY) continue;
      let ox = x;
      let oy = o.minY + Math.floor(rng() * (top - o.minY + 1));
      let oz = z;
      for (let k = 0; k < o.size; k++) {
        put(dim, ox, oy, oz, o.id);
        const axis = Math.floor(rng() * 3);
        const step = rng() < 0.5 ? -1 : 1;
        if (axis === 0) ox += step;
        else if (axis === 1) oy += step;
        else oz += step;
      }
    }
    yield;
  }
}

// ---------------------------------------------------------------- space generation

const STATION_R = 18.5;
const DOME_R = 17.5;

function* stationInChunk(dim, x0, z0, ctr) {
  if (x0 + 15 < -20 || x0 > 20 || z0 + 15 < -20 || z0 > 20) return;
  const Y = SPACE_Y;
  for (let x = Math.max(x0, -20); x <= Math.min(x0 + 15, 20); x++) {
    for (let z = Math.max(z0, -20); z <= Math.min(z0 + 15, 20); z++) {
      const d = Math.hypot(x, z);
      if (d > STATION_R) continue;
      let top;
      if (d <= 2.6) top = "minecraft:gold_block";
      else if (d >= 4.6 && d <= 5.6) top = "minecraft:sea_lantern";
      else if (d >= 17.2) top = "minecraft:iron_block";
      else top = (x + z) % 2 === 0 ? "minecraft:white_concrete" : "minecraft:light_gray_concrete";
      dim.setBlockType({ x, y: Y, z }, top);
      // saucer hull
      const depth = Math.floor((STATION_R - d) * 0.42);
      fill(dim, x, Y - 1 - depth, z, x, Y - 1, z, "minecraft:gray_concrete");
      // glass dome (with a doorway on each side)
      if (d <= DOME_R) {
        const topRel = Math.floor(Math.sqrt(DOME_R * DOME_R - d * d));
        const innerR = DOME_R - 1.3;
        const inner = d <= innerR ? Math.floor(Math.sqrt(innerR * innerR - d * d)) : -1;
        let lo = Math.max(inner + 1, 1);
        if (d >= 11 && (Math.abs(x) <= 2 || Math.abs(z) <= 2)) lo = Math.max(lo, 6);
        if (topRel >= lo) fill(dim, x, Y + lo, z, x, Y + topRel, z, "minecraft:glass");
      }
      ctr.n += 3;
    }
    if (ctr.n > 400) {
      ctr.n = 0;
      yield;
    }
  }
  // lamp pillars
  for (const sx of [-9, 9]) {
    for (const sz of [-9, 9]) {
      if (sx < x0 || sx > x0 + 15 || sz < z0 || sz > z0 + 15) continue;
      fill(dim, sx, Y + 1, sz, sx, Y + 7, sz, "minecraft:quartz_pillar");
      dim.setBlockType({ x: sx, y: Y + 8, z: sz }, "minecraft:sea_lantern");
    }
  }
  yield;
}

// planets floating around the station
const RING = 240; // distance of the planets from the station (was 64): space is now ~4x wider
const SPHERE_DEFS = [
  { key: "earth", r: 13, ang: 10, dy: 18 },
  { key: "namek", r: 11, ang: 70, dy: -26 },
  { key: "vegeta", r: 11, ang: 130, dy: 38 },
  { key: "frieza", r: 12, ang: 190, dy: -14 },
  { key: "yardrat", r: 9, ang: 250, dy: 26 },
  { key: U6_KEY, r: 10, ang: 310, dy: 4 },
  // added last: the seed of each sphere comes from its index, so the existing planets keep their look
  { key: KAIOSHIN_KEY, r: 10, ang: 340, dy: -8 },
];
const SPHERES = SPHERE_DEFS.map((d, i) => {
  const a = (d.ang * Math.PI) / 180;
  return { ...d, x: Math.round(Math.cos(a) * RING), y: SPACE_Y + d.dy, z: Math.round(Math.sin(a) * RING), seed: 900 + i * 13 };
});

function spherePick(S, x, y, z) {
  const ny = (y - S.y) / S.r;
  const n = noise3(x / 4.5, y / 4.5, z / 4.5, S.seed);
  const m = noise3(x / 2.2 + 17, y / 2.2, z / 2.2 - 9, S.seed + 3);
  switch (S.key) {
    case "earth":
      if (Math.abs(ny) > 0.84 || m > 0.82) return "minecraft:white_concrete";
      if (n > 0.7) return "minecraft:brown_concrete";
      if (n > 0.54) return "minecraft:green_concrete";
      return n > 0.47 ? "minecraft:light_blue_concrete" : "minecraft:blue_concrete";
    case "namek":
      if (m > 0.85) return "minecraft:white_concrete";
      if (n > 0.6) return "minecraft:green_concrete";
      if (n > 0.46) return "minecraft:lime_concrete";
      return n > 0.4 ? "minecraft:cyan_concrete" : "minecraft:blue_concrete";
    case "vegeta":
      if (m > 0.86) return "minecraft:orange_concrete";
      if (n > 0.6) return "minecraft:red_concrete";
      return n > 0.38 ? "minecraft:red_terracotta" : "minecraft:orange_terracotta";
    case "frieza":
      if (n > 0.62) return "minecraft:magenta_concrete";
      if (n < 0.34) return "minecraft:purple_terracotta";
      return m > 0.8 ? "minecraft:white_concrete" : "minecraft:purple_concrete";
    case "yardrat":
      if (m > 0.8) return "minecraft:white_concrete";
      if (n < 0.34) return "minecraft:magenta_terracotta";
      return n > 0.62 ? "minecraft:pink_terracotta" : "minecraft:pink_concrete";
    case U6_KEY:
      // the arena planet: white tiled stage on top, gold ring round the equator, purple cosmos below
      if (Math.abs(ny) < 0.1) return "minecraft:gold_block";
      if (ny > 0.78) return m > 0.55 ? "minecraft:white_concrete" : "minecraft:light_blue_concrete";
      if (m > 0.84) return "minecraft:lime_concrete";
      if (n > 0.64) return "minecraft:magenta_concrete";
      return n < 0.36 ? "minecraft:light_blue_concrete" : "minecraft:purple_concrete";
    case KAIOSHIN_KEY:
      // Kaioshin: bright green terraces and rivers, brown striped cliffs, pink bubbles drifting in a magenta haze
      if (m > 0.84) return "minecraft:pink_concrete";
      if (n > 0.68) return "minecraft:brown_terracotta";
      if (n > 0.5) return "minecraft:lime_concrete";
      return n > 0.42 ? "minecraft:green_concrete" : n > 0.36 ? "minecraft:light_blue_concrete" : "minecraft:magenta_concrete";
  }
}

function* sphereInChunk(dim, S, x0, z0, ctr) {
  const r2 = S.r * S.r;
  for (let x = Math.max(x0, S.x - S.r); x <= Math.min(x0 + 15, S.x + S.r); x++) {
    for (let z = Math.max(z0, S.z - S.r); z <= Math.min(z0 + 15, S.z + S.r); z++) {
      const d2 = (x - S.x) * (x - S.x) + (z - S.z) * (z - S.z);
      if (d2 > r2) continue;
      const dyMax = Math.floor(Math.sqrt(r2 - d2));
      let runStart = S.y - dyMax;
      let runId = spherePick(S, x, runStart, z);
      for (let y = runStart + 1; y <= S.y + dyMax; y++) {
        const id = spherePick(S, x, y, z);
        if (id !== runId) {
          fill(dim, x, runStart, z, x, y - 1, z, runId);
          ctr.n++;
          runStart = y;
          runId = id;
        }
      }
      fill(dim, x, runStart, z, x, S.y + dyMax, z, runId);
      ctr.n++;
    }
    if (ctr.n > 150) {
      ctr.n = 0;
      yield;
    }
  }
}

// asteroids: deterministic per 48x48 cell
const AST_CELL = 110; // asteroids are spread further apart too
const ASTEROID_ROCKS = ["minecraft:andesite", "minecraft:tuff", "minecraft:cobbled_deepslate", "minecraft:dripstone_block"];
const ASTEROID_ORES = ["minecraft:iron_ore", "minecraft:gold_ore", "minecraft:diamond_ore", "minecraft:redstone_ore", "dbe:deepslate_evolitium_ore"];
const asteroidCache = new Map();

function asteroidsForCell(i, j) {
  const k = i + "," + j;
  if (asteroidCache.has(k)) return asteroidCache.get(k);
  const rng = mulberry32(Math.imul(i, 92837111) ^ Math.imul(j, 689287499) ^ 0x57a2);
  const list = [];
  const count = 1 + Math.floor(rng() * 3);
  for (let n = 0; n < count; n++) {
    const a = {
      x: Math.floor((i + rng()) * AST_CELL),
      z: Math.floor((j + rng()) * AST_CELL),
      y: 60 + Math.floor(rng() * 190),
      r: 2.5 + rng() * rng() * 7,
      ry: 0.6 + rng() * 0.4,
      block: ASTEROID_ROCKS[Math.floor(rng() * ASTEROID_ROCKS.length)],
      ore: ASTEROID_ORES[Math.floor(rng() * ASTEROID_ORES.length)],
      seed: Math.floor(rng() * 100000),
    };
    // keep the station and the planet ring clear
    if (Math.hypot(a.x, a.z) < 60 + a.r && Math.abs(a.y - SPACE_Y) < 50) continue;
    if (SPHERES.some((S) => Math.hypot(a.x - S.x, a.y - S.y, a.z - S.z) < S.r + a.r * 1.3 + 6)) continue;
    list.push(a);
  }
  asteroidCache.set(k, list);
  return list;
}

function* asteroidInChunk(dim, a, x0, z0, ctr) {
  const reach = Math.ceil(a.r * 1.3);
  for (let x = Math.max(x0, a.x - reach); x <= Math.min(x0 + 15, a.x + reach); x++) {
    for (let z = Math.max(z0, a.z - reach); z <= Math.min(z0 + 15, a.z + reach); z++) {
      const dx = x - a.x;
      const dz = z - a.z;
      const lump = 0.78 + 0.5 * valueNoise2((x + a.x) / 4.2, (z + a.z) / 4.2, a.seed);
      const R = a.r * lump;
      const d2 = dx * dx + dz * dz;
      if (d2 >= R * R) continue;
      const dy = Math.floor(a.r * a.ry * lump * Math.sqrt(1 - d2 / (R * R)));
      fill(dim, x, a.y - dy, z, x, a.y + dy, z, a.block);
      ctr.n++;
    }
    if (ctr.n > 200) {
      ctr.n = 0;
      yield;
    }
  }
  // ore vein in the heart of bigger asteroids
  if (a.r >= 4 && a.x >= x0 + 1 && a.x <= x0 + 14 && a.z >= z0 + 1 && a.z <= z0 + 14) {
    for (const [ox, oy, oz] of [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]]) put(dim, a.x + ox, a.y + oy, a.z + oz, a.ore);
  }
}

function* spaceJob(dim, cx, cz) {
  const x0 = cx * 16;
  const z0 = cz * 16;
  const ctr = { n: 0 };
  yield* stationInChunk(dim, x0, z0, ctr);
  for (const S of SPHERES) {
    if (S.x + S.r < x0 || S.x - S.r > x0 + 15 || S.z + S.r < z0 || S.z - S.r > z0 + 15) continue;
    yield* sphereInChunk(dim, S, x0, z0, ctr);
  }
  const i0 = Math.floor((x0 - 14) / AST_CELL);
  const i1 = Math.floor((x0 + 15 + 14) / AST_CELL);
  const j0 = Math.floor((z0 - 14) / AST_CELL);
  const j1 = Math.floor((z0 + 15 + 14) / AST_CELL);
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      for (const a of asteroidsForCell(i, j)) yield* asteroidInChunk(dim, a, x0, z0, ctr);
    }
  }
  yield;
  dim.setBlockType({ x: x0, y: MIN_Y, z: z0 }, BEDROCK); // generated
}

// ---------------------------------------------------------------- job runner (one chunk job at a time)

let busy = false;
let busyActivity, repairing = false;
const retryAt = new Map();
const chunkJobs = new Map();

const waitTicks = (n) => new Promise((resolve) => system.runTimeout(resolve, n));

function scopedPlanetDimension(P, dim, cx, cz, phase, activity) {
  const halo = phase === "decoration" ? 1 : 0;
  const scope = { expected: new Map(), failed: false, error: undefined, operation: "starting", position: undefined };
  // Retain this job's own writes after required-write verification drains expected.
  // A later overlap still has to read and match that exact value before replacing it.
  const written = new Map(), columns = new Map();
  const fail = error => { if (!scope.failed) { scope.failed = true; scope.error = error; } throw error; };
  const writable = (from, to) => {
    if (![from.x, from.y, from.z, to.x, to.y, to.z].every(Number.isInteger) || from.x < (cx - halo) * 16 || to.x > (cx + halo + 1) * 16 - 1 || from.z < (cz - halo) * 16 || to.z > (cz + halo + 1) * 16 - 1 || from.y < MIN_Y || to.y > 319) throw new Error(P.key + " " + phase + " write exceeds its loaded footprint: " + JSON.stringify({ from, to }));
    planetWritable(P, cx, cz, phase);
    for (let x = chunkOf(from.x); x <= chunkOf(to.x); x++) for (let z = chunkOf(from.z); z <= chunkOf(to.z); z++) planetWritable(P, x, z, phase);
  };
  const remember = (from, to, block) => {
    const type = typeof block === "string" ? block : block.type?.id ?? block.id;
    if (!type) throw new Error("Cannot verify required block type");
    for (let x = from.x; x <= to.x; x++) for (let z = from.z; z <= to.z; z++) for (let y = from.y; y <= to.y; y++) {
      const key = x + "," + y + "," + z;
      scope.expected.set(key, { x, y, z, type }); written.set(key, type);
    }
  };
  const preserveExisting = (from, to, block) => {
    const desired = typeof block === "string" ? block : block.type?.id ?? block.id;
    if (!desired) throw new Error("Cannot verify required block type");
    if (phase === "terrain" && desired === P.liquid) for (const proof of activity.containment?.values() ?? []) {
      if (world.getDynamicProperty(proof.ownerKey) !== proof.owner || world.getDynamicProperty(proof.bufferKey) !== proof.buffer) throw new PlanetPreservationError(P.key + " fluid containment changed during preparation; preserve the neighboring player edit and retry after review");
    }
    // Prove the whole volume before the first native write, including foundation markers.
    for (let x = from.x; x <= to.x; x++) for (let z = from.z; z <= to.z; z++) {
      const columnKey = x + "," + z;
      if (phase === "decoration" && !columns.has(columnKey)) columns.set(columnKey, planetColumn(P, x, z));
      for (let y = from.y; y <= to.y; y++) {
        const point = { x, y, z }, current = dim.getBlock(point);
        if (!current) throw new Error(P.key + " write preflight unavailable at " + x + "," + y + "," + z);
        activity.serial++;
        if (current.typeId === desired || phase === "terrain" && current.typeId === AIR) continue;
        const buffer = phase === "terrain" && world.getDynamicProperty(planetBuffer(P, chunkOf(x), chunkOf(z)));
        if ((buffer === "ready" || buffer === "converting") && y > MIN_Y && y <= P.liquidLevel && current.typeId === P.stone) continue;
        if (phase === "decoration") {
          const key = x + "," + y + "," + z;
          // This direct read proves a preceding write, even when both occur before a yield.
          if (written.get(key) === current.typeId) continue;
          const natural = y === MIN_Y ? (x === chunkOf(x) * 16 + 1 && z === chunkOf(z) * 16 ? P.stone : BEDROCK) : columns.get(columnKey).find(span => y >= span.from && y <= span.to)?.type ?? AIR;
          if (current.typeId === natural) continue;
        }
        throw new PlanetPreservationError(P.key + " " + phase + " preserves unexpected " + current.typeId + " at " + x + "," + y + "," + z + "; required " + desired + "; review the world copy before retrying decoration or repair");
      }
    }
  };
  const guarded = new Proxy(dim, { get(target, name) {
    if (name === "getBlock") return point => {
      scope.lastRead = point;
      try { const block = target.getBlock(point); if (!block) throw new Error(P.key + " block unavailable at " + JSON.stringify(point)); activity.serial++; return block; }
      catch (error) { return fail(error); }
    };
    if (name === "setBlockType") return (point, block) => {
      scope.operation = "setBlockType"; scope.position = point;
      try { if (scope.failed) throw scope.error; scope.freshBulk = undefined; writable(point, point); preserveExisting(point, point, block); target.setBlockType(point, block); remember(point, point, block); }
      catch (error) { return fail(error); }
    };
    if (name === "fillBlocks") return (volume, block, options) => {
      scope.operation = "fillBlocks";
      try {
        if (scope.failed) throw scope.error;
        const from = volume.getMin(), to = volume.getMax(); scope.position = { from, to };
        writable(from, to);
        if (options?.blockFilter) throw new Error("Filtered required writes cannot be certified by this generator");
        const proof = scope.freshBulk; scope.freshBulk = undefined;
        const fresh = proof && proof.tick === system.currentTick && block === P.stone && from.x === proof.from.x && from.y === proof.from.y && from.z === proof.from.z && to.x === proof.to.x && to.y === proof.to.y && to.z === proof.to.z && world.getDynamicProperty(planetBuffer(P, cx, cz)) === "building";
        if (!fresh) preserveExisting(from, to, block);
        const result = target.fillBlocks(volume, block, options);
        // This single atomic fresh fill has its own complete, batched containment proof below.
        if (!fresh) remember(from, to, block);
        return result;
      } catch (error) { return fail(error); }
    };
    const value = Reflect.get(target, name, target);
    return typeof value === "function" ? value.bind(target) : value;
  } });
  scope.dimension = guarded;
  return scope;
}

function* verifyRequiredWrites(scope, P, cx, cz, phase) {
  if (scope.failed) throw scope.error;
  let checked = 0;
  for (const [key, point] of scope.expected) {
    if (checked % 64 === 0) planetWritable(P, cx, cz, phase);
    scope.operation = "verify required write"; scope.position = point;
    const actual = scope.dimension.getBlock(point);
    if (actual.typeId !== point.type) throw new Error(P.key + " " + phase + " write verification failed at " + point.x + "," + point.y + "," + point.z + "; expected " + point.type + ", observed " + actual.typeId);
    scope.expected.delete(key);
    if (++checked % 64 === 0) yield;
  }
}

function* checkedPlanetJob(generator, scope, P, cx, cz) {
  try {
    for (;;) {
      if (scope.failed) throw scope.error;
      const next = generator.next();
      yield* verifyRequiredWrites(scope, P, cx, cz, "terrain");
      if (next.done) break;
      yield;
    }
  } finally { generator.return(); }
}

function freshBulkEmpty(P, dim, cx, cz, activity) {
  for (let y = MIN_Y; y <= 319; y += 128) {
    const from = { x: cx * 16, y, z: cz * 16 }, to = { x: cx * 16 + 15, y: Math.min(y + 127, 319), z: cz * 16 + 15 };
    const found = dim.getBlocks(new BlockVolume(from, to), { excludeTypes: [AIR] }, false);
    for (const point of found.getBlockLocationIterator()) {
      if (!point || ![point.x, point.y, point.z].every(Number.isInteger) || point.x < from.x || point.x > to.x || point.y < from.y || point.y > to.y || point.z < from.z || point.z > to.z) throw new Error(P.key + " bulk ownership inspection returned an invalid position");
      const actual = dim.getBlock(point);
      if (!actual || actual.typeId === AIR) throw new Error(P.key + " bulk ownership inspection was inconsistent; no fresh buffer was written");
      activity.serial++; return false;
    }
    activity.serial++;
  }
  return true;
}

function* verifyContainment(P, dim, cx, cz, activity, strictBuffer = false) {
  const native = queriesUsable(dim, cx, cz);
  if (native) {
    // One query proves a dry chunk or a finished scaffold (volume within the native limit, as the bulk fill above).
    const allowed = strictBuffer ? solidTypes(P).filter(type => type === P.stone) : solidTypes(P);
    if (allowed.length && !findUnexpectedBlock(dim, { x: cx * 16, y: MIN_Y + 1, z: cz * 16 }, { x: cx * 16 + 15, y: P.liquidLevel, z: cz * 16 + 15 }, allowed)) {
      activity.serial++;
      yield;
      return;
    }
  }
  for (let x = cx * 16; x < cx * 16 + 16; x++) for (let z = cz * 16; z < cz * 16 + 16; z++) {
    const profile = planetColumn(P, x, z);
    if (native && columnContained(P, dim, x, z, strictBuffer, profile)) {
      activity.serial++;
      if (z === cz * 16 + 15) yield;
      continue;
    }
    for (let y = MIN_Y + 1; y <= P.liquidLevel; y++) {
      const actual = dim.getBlock({ x, y, z }), expected = profile.find(span => y >= span.from && y <= span.to)?.type;
      if (!actual) throw new Error(P.key + " fluid containment unavailable at " + x + "," + y + "," + z);
      activity.serial++;
      learnSolid(P, actual);
      const contained = strictBuffer ? actual.typeId === P.stone && actual.isSolid && !actual.isLiquid : actual.isSolid && !actual.isLiquid || expected === P.liquid && actual.typeId === P.liquid && actual.isLiquid;
      if (!contained)
        throw new PlanetPreservationError(P.key + " fluid containment is incomplete at " + x + "," + y + "," + z + "; observed " + actual.typeId + "; review and repair this neighboring chunk before travel");
      if ((y - MIN_Y) % 64 === 0 || y === P.liquidLevel) yield;
    }
  }
}

function* preparePlanetBuffer(P, dim, cx, cz, activity) {
  const ownerKey = planetOwnership(P, cx, cz), bufferKey = planetBuffer(P, cx, cz);
  const { state, buffer, progress } = planetProvenance(P, cx, cz);
  if (["complete", "legacy", "protected"].includes(state)) {
    // Existing worlds may contain valid lakes/builds. Read real containment, never adopt them.
    yield* verifyContainment(P, dim, cx, cz, activity);
    return;
  }
  if (state === "building" && (buffer === undefined || buffer === "legacy-profile" || buffer === "profile")) {
    // A reviewed old chunk can contain a correct full profile without new scaffold provenance.
    // Certify the existing blocks only; this does not authorize any buffer conversion.
    const old = scopedPlanetDimension(P, dim, cx, cz, "terrain", activity);
    yield* verifyPlanetProfile(P, old.dimension, cx, cz);
    return;
  }
  if (state === "building" && (buffer === "ready" || buffer === "converting" || buffer === "profile")) {
    yield* verifyContainment(P, dim, cx, cz, activity, buffer === "ready");
    return;
  }
  const scope = scopedPlanetDimension(P, dim, cx, cz, "terrain", activity), target = scope.dimension;
  if (state !== "building") {
    if (chunkState(target, cx, cz) >= 1) { world.setDynamicProperty(ownerKey, "legacy"); yield* verifyContainment(P, dim, cx, cz, activity); return; }
    world.setDynamicProperty(ownerKey, "inspecting");
    const bulk = typeof dim.getBlocks === "function";
    const empty = bulk ? freshBulkEmpty(P, target, cx, cz, activity) : yield* emptyChunk(target, cx, cz, MIN_Y, 319);
    if (!empty) {
      if (world.getDynamicProperty(ownerKey) !== "protected") world.setDynamicProperty(ownerKey, "legacy");
      yield* verifyContainment(P, dim, cx, cz, activity); return;
    }
    if (world.getDynamicProperty(ownerKey) === "protected") throw new PlanetPreservationError("Planet buffer inspection interrupted by a player edit");
    world.setDynamicProperty(ownerKey, "building");
    if (bulk) {
      // Only an atomic empty proof authorizes partial-buffer replacement after interruption.
      world.setDynamicProperty(bufferKey, "building");
      const from = { x: cx * 16, y: MIN_Y + 1, z: cz * 16 }, to = { x: cx * 16 + 15, y: P.liquidLevel, z: cz * 16 + 15 };
      if ((to.y - from.y + 1) * 256 > 32768) throw new Error("Planet buffer exceeds the native fill volume limit");
      // No yield between the three empty bulk queries, provenance and this one native fill.
      scope.freshBulk = { from, to, tick: system.currentTick };
      target.fillBlocks(new BlockVolume(from, to), P.stone);
      yield* verifyContainment(P, dim, cx, cz, activity, true);
      planetWritable(P, cx, cz, "terrain");
      world.setDynamicProperty(bufferKey, "ready");
      return;
    }
    world.setDynamicProperty(bufferKey, "building-air:0");
  }
  let issued = progress ?? 0, range = 0;
  yield* checkedPlanetJob((function* () {
    for (let x = cx * 16; x < cx * 16 + 16; x++) for (let z = cz * 16; z < cz * 16 + 16; z++) for (let y = MIN_Y + 1; y <= P.liquidLevel; y += 64) {
      planetWritable(P, cx, cz, "terrain");
      const to = Math.min(y + 63, P.liquidLevel);
      if (buffer === "building" || ++range <= issued) fillAirColumn(target, x, z, y, to, P.stone);
      else {
        // A yielded empty scan cannot adopt even matching imported rocks as our scaffold.
        for (let at = y; at <= to; at++) if (target.getBlock({ x, y: at, z }).typeId !== AIR) throw new PlanetPreservationError(P.key + " buffer changed after inspection at " + x + "," + at + "," + z + "; preserve it for reviewed repair");
        world.setDynamicProperty(bufferKey, "building-air:" + range);
        issued = range;
        target.fillBlocks(new BlockVolume({ x, y, z }, { x, y: to, z }), P.stone);
      }
      yield;
    }
  })(), scope, P, cx, cz);
  yield* verifyContainment(P, dim, cx, cz, activity, true);
  planetWritable(P, cx, cz, "terrain");
  world.setDynamicProperty(bufferKey, "ready");
}

async function waitForWriter() {
  let last = system.currentTick, activity, token = 0;
  while (busy) {
    if (activity !== busyActivity) { activity = busyActivity; token = 0; }
    if (activity && activity.serial > token) { token = activity.serial; last = system.currentTick; }
    if (system.currentTick - last >= 600) throw new Error("Space terrain queue made no verified progress for600 ticks");
    await waitTicks(2);
  }
}

const reported = new Set();
let lastError = "none";

function reportError(W, e, operation = "") {
  lastError = (W ? W.key : "?") + ": " + String(e);
  const k = operation + ": " + lastError;
  if (reported.has(k)) return;
  reported.add(k);
  if (reported.size > 128) reported.delete(reported.values().next().value);
  console.warn("[Space] " + operation + ": " + String(e) + (e?.stack ? "\n" + e.stack : ""));
}

function runExclusive(build, W, cx, cz, phase = "terrain", strict = false) {
  const key = W.key + ":" + phase + ":" + cx + "," + cz;
  let shared = chunkJobs.get(key);
  if (!shared) {
    shared = runLoadedJob(build, key, W, cx, cz, phase);
    chunkJobs.set(key, shared);
    shared.then(() => chunkJobs.delete(key), () => chunkJobs.delete(key));
  }
  return strict ? shared : shared.catch(() => false);
}

async function runLoadedJob(build, key, W, cx, cz, phase) {
  let area, ownsBusy = false, scope;
  const activity = { serial: 0 };
  try {
    if (repairing) throw new Error("Space terrain repair is active; retry after it finishes");
    while (busy) await waitForWriter();
    if (repairing) throw new Error("Space terrain repair is active; retry after it finishes");
    busy = ownsBusy = true; busyActivity = activity;
    const dim = world.getDimension(W.id), halo = W.kind === "planet" ? 1 : 0;
    area = await acquireLoadedArea(dim, { x: (cx - halo) * 16, y: MIN_Y, z: (cz - halo) * 16 }, { x: (cx + halo + 1) * 16 - 1, y: MIN_Y, z: (cz + halo + 1) * 16 - 1 }, W.key + " " + phase + " chunk " + cx + "," + cz);
    activity.serial++;
    if (W.kind === "planet") scope = scopedPlanetDimension(W, dim, cx, cz, phase, activity);
    const target = scope?.dimension ?? dim;
    await runTerrainJob((function* () {
      let certifyExisting = false;
      if (W.kind === "planet") {
        const { state, buffer } = planetProvenance(W, cx, cz);
        if (phase === "terrain") {
          if (["complete", "legacy", "protected"].includes(state)) return;
          if (state === "building" && (buffer === undefined || buffer === "legacy-profile" || buffer === "profile")) {
            yield* verifyPlanetProfile(W, target, cx, cz);
            certifyExisting = buffer !== "profile";
          } else {
            activity.containment = new Map();
            for (const [dx, dz] of BUFFER_NEIGHBORS) {
              const nx = cx + dx, nz = cz + dz, ownerKey = planetOwnership(W, nx, nz), bufferKey = planetBuffer(W, nx, nz);
              const ownerBefore = world.getDynamicProperty(ownerKey), bufferBefore = world.getDynamicProperty(bufferKey);
              yield* preparePlanetBuffer(W, dim, nx, nz, activity);
              const owner = world.getDynamicProperty(ownerKey), buffer = world.getDynamicProperty(bufferKey);
              const startedFresh = ownerBefore === undefined || ownerBefore === "inspecting";
              if (startedFresh ? !["building", "legacy"].includes(owner) : ownerBefore !== owner) throw new PlanetPreservationError(W.key + " fluid preparation was changed by an external edit");
              if (bufferBefore !== buffer && !(buffer === "ready" && (bufferBefore === undefined || bufferBefore === "building" || bufferBefore?.startsWith("building-air:")))) throw new PlanetPreservationError(W.key + " buffer provenance changed during preparation");
              if (dx || dz) activity.containment.set(nx + "," + nz, { ownerKey, bufferKey, owner, buffer });
            }
            planetWritable(W, cx, cz, "terrain");
            world.setDynamicProperty(planetBuffer(W, cx, cz), "converting");
          }
        } else if (state !== "complete") return;
      }
      // A certified profile still goes through the real terrain iterator; matching
      // blocks cause no terrain writes and the full profile is proven again before markers.
      const gen = build(target);
      try {
        for (;;) {
          if (scope?.failed) throw scope.error;
          const next = gen.next();
          if (scope) yield* verifyRequiredWrites(scope, W, cx, cz, phase);
          if (next.done) break;
          yield;
        }
      } finally { gen.return(); }
      if (scope && phase === "terrain") {
        const x = cx * 16, z = cz * 16;
        fill(target, x + 2, MIN_Y, z, x + 15, MIN_Y, z, BEDROCK);
        fill(target, x, MIN_Y, z + 1, x + 15, MIN_Y, z + 15, BEDROCK);
        put(target, x + 1, MIN_Y, z, W.stone);
        yield* verifyRequiredWrites(scope, W, cx, cz, phase);
        put(target, x, MIN_Y, z, BEDROCK);
        yield* verifyRequiredWrites(scope, W, cx, cz, phase);
        planetWritable(W, cx, cz, phase);
        world.setDynamicProperty(planetBuffer(W, cx, cz), certifyExisting ? "legacy-profile" : "profile");
        world.setDynamicProperty(planetOwnership(W, cx, cz), "complete");
      } else if (scope && phase === "decoration") {
        put(target, cx * 16 + 1, MIN_Y, cz * 16, BEDROCK);
        yield* verifyRequiredWrites(scope, W, cx, cz, phase);
      }
    })(), W.kind === "planet" ? { inactivityTicks: 2400, activity: () => activity.serial, label: key } : { label: key });
    retryAt.delete(key);
    return true;
  } catch (e) {
    retryAt.set(key, e instanceof PlanetPreservationError ? Infinity : system.currentTick + 100);
    try { reportError(W, e, key + " failed; lastOperation=" + scope?.operation + ", lastWrite=" + JSON.stringify(scope?.position) + ", lastRead=" + JSON.stringify(scope?.lastRead)); } catch (feedback) { console.warn("[Space] terrain diagnostics unavailable: " + feedback); }
    if (e instanceof PlanetPreservationError) return false;
    throw e;
  } finally {
    if (area) releaseLoadedArea(area);
    if (ownsBusy) { busy = false; busyActivity = undefined; }
    system.run(() => {
      try {
        scan();
      } catch (e) {
        /* ignore */
      }
    });
  }
}

const canRetry = (key) => {
  const t = retryAt.get(key);
  return t === undefined || system.currentTick >= t;
};

function terrainFor(W, dim, cx, cz) {
  return W.kind === "space" ? spaceJob(dim, cx, cz) : terrainJob(W, dim, cx, cz);
}


// ---------------------------------------------------------------- pods

/** The Space Pod entity the player is riding, if any. */
function ridingPod(p) {
  try {
    const e = p.getComponent("minecraft:riding")?.entityRidingOn;
    return e && e.isValid && POD_IDS.includes(e.typeId) ? e : undefined;
  } catch (err) {
    return undefined;
  }
}

/** Fold a pod back into the inventory (used when travelling to a world where it cannot follow). */
function dockPod(player, pod) {
  const podType = pod.typeId;
  try {
    pod.remove();
  } catch (err) {
    /* already gone */
  }
  try {
    const left = player.getComponent("minecraft:inventory").container.addItem(new mc.ItemStack(podType, 1));
    if (left) player.dimension.spawnItem(left, player.location);
    player.sendMessage({ translate: "item." + podType });
  } catch (err) {
    /* ignore */
  }
}

// ---------------------------------------------------------------- sphere retrofit (Universe 6, Kaioshin)
// Space chunks that were generated before a planet existed have no sphere in them. The first time a player is in
// space we add the missing spheres to those chunks (chunks generated later get them from spaceJob like every other planet).
const U6_SPHERE_PROP = "dbe:space_u6_sphere";
const KAIOSHIN_SPHERE_PROP = "dbe:space_kai_sphere";
const RETROFITS = [
  { key: U6_KEY, prop: U6_SPHERE_PROP, name: "Universe 6" },
  { key: KAIOSHIN_KEY, prop: KAIOSHIN_SPHERE_PROP, name: "Kaioshin" },
];
let retrofitting = false;

const needsRetrofit = () => RETROFITS.some((R) => world.getDynamicProperty(R.prop) !== 1);

async function retrofitSphere(R) {
  const S = SPHERES.find((s) => s.key === R.key);
  if (!S) return;
  let area = null;
  try {
    const dim = world.getDimension(SPACE.id);
    area = await acquireLoadedArea(dim,
      { x: S.x - S.r - 16, y: MIN_Y, z: S.z - S.r - 16 },
      { x: S.x + S.r + 16, y: MIN_Y, z: S.z + S.r + 16 }, "space " + R.name + " sphere");
    for (let cx = chunkOf(S.x - S.r); cx <= chunkOf(S.x + S.r); cx++) {
      for (let cz = chunkOf(S.z - S.r); cz <= chunkOf(S.z + S.r); cz++) {
        for (let tries = 0; tries < 40 && chunkState(dim, cx, cz) === -1; tries++) await waitTicks(5);
        const st = chunkState(dim, cx, cz);
        if (st === -1) throw new Error("chunk not loaded");
        if (st === 0) continue; // not generated yet: spaceJob will add the sphere itself
        await runExclusive(loaded => sphereInChunk(loaded, S, cx * 16, cz * 16, { n: 0 }), SPACE, cx, cz, "retrofit", true);
      }
    }
    world.setDynamicProperty(R.prop, 1);
  } catch (e) {
    console.warn("[Space] " + R.name + " sphere retrofit will retry: " + e);
  } finally {
    if (area) releaseLoadedArea(area);
  }
}

async function retrofitSpheres() {
  if (retrofitting) return;
  retrofitting = true;
  try {
    for (const R of RETROFITS) {
      if (world.getDynamicProperty(R.prop) === 1) continue;
      await retrofitSphere(R);
    }
  } finally {
    retrofitting = false;
  }
}

// ---------------------------------------------------------------- per-player scan

const fogOf = new Map(); // player id -> world key whose fog is active
const lastLaunch = new Map(); // player id -> tick of last atmosphere launch
const lastSphere = new Map(); // player id -> tick of last orbit trigger

function updateFog(p, W) {
  const want = W ? W.key : null;
  const have = fogOf.get(p.id) ?? null;
  if (want === have) return;
  fogOf.set(p.id, want);
  try {
    if (have) p.runCommand("fog @s remove " + WORLDS[have].fogTag);
    if (want) p.runCommand("fog @s push " + W.fog + " " + W.fogTag);
  } catch (e) {
    /* ignore */
  }
}

// ---------------------------------------------------------------- death / respawn safety
// The add-on sends dead players to the Other World after they respawn (tag dbe:join_other_world, region
// "other_world"). If you die on a planet or in space the game can respawn you in that same dimension, where the
// void rules below used to take over and strand you on the Orbital Station. For 30 s after a respawn,
// players carrying the tag are left alone by the space rules and moved to the Other World if that did not happen.
const DEAD_TAG = "dbe:join_other_world";
const OTHER_WORLD = { dim: "dbe:other_world", x: 0.5, y: 65, z: 39.5 };
const rescueUntil = new Map(); // player id -> tick until which the respawn rescue is active
const lastRescue = new Map(); // player id -> tick of the last rescue attempt

function rescueDead(p) {
  const until = rescueUntil.get(p.id);
  if (until === undefined) return false;
  if (system.currentTick > until || !p.hasTag(DEAD_TAG)) {
    rescueUntil.delete(p.id);
    return false;
  }
  if (p.dimension.id !== OTHER_WORLD.dim && !isTravelPending(p) && system.currentTick - (lastRescue.get(p.id) ?? -1000) >= 30) {
    lastRescue.set(p.id, system.currentTick);
    safeTeleport(p, { x: OTHER_WORLD.x, y: OTHER_WORLD.y, z: OTHER_WORLD.z }, { dimension: world.getDimension(OTHER_WORLD.dim), label: "Other World respawn recovery" })
      .then(() => {
        p.setProperty("dbe:is_death", true);
      })
      .catch((error) => console.warn("[Space] Other World respawn recovery failed; retry is bounded by the respawn window: " + error));
  }
  return true;
}

function scan() {
  ensureBlocks();
  const players = world.getPlayers();

  for (const p of players) {
    const W = BY_DIM.get(p.dimension.id);
    updateFog(p, W);
    if (rescueDead(p)) continue;
    const dimId = p.dimension.id;
    const canLaunch = W ? W.kind === "planet" : dimId === "minecraft:overworld" || dimId === NAMEK_ID || dimId === U6_ID || dimId === KAIOSHIN_ID;
    if (canLaunch && p.location.y >= LAUNCH_Y && !travelling.has(p.id) && system.currentTick - (lastLaunch.get(p.id) ?? -10000) > LAUNCH_COOLDOWN) {
      lastLaunch.set(p.id, system.currentTick);
      try {
        p.onScreenDisplay.setActionBar({ translate: "dbe.space.launch" });
      } catch (err) {
        /* ignore */
      }
      travelTo(p, "space", { atmosphere: true });
      continue;
    }
    if (!W) continue;
    for (const e of W.effects) {
      try {
        p.addEffect(e.id, 60, { amplifier: e.amp, showParticles: false });
      } catch (err) {
        /* ignore */
      }
    }
    const { x, y, z } = p.location;
    if (W.kind === "space") {
      if (!retrofitting && needsRetrofit()) retrofitSpheres();
      if (y < 30) {
        try {
          p.teleport(SPACE_STATION);
          p.sendMessage({ translate: "dbe.space.fell" });
        } catch (err) {
          /* ignore */
        }
        continue;
      }
      // flying into a planet sphere takes you there
      for (const S of SPHERES) {
        const reach = S.r + 2.5;
        if (Math.hypot(x - S.x, y - S.y, z - S.z) < reach && system.currentTick - (lastSphere.get(p.id) ?? -1000) > 100) {
          lastSphere.set(p.id, system.currentTick);
          p.sendMessage(tr("dbe.space.orbit", destName(S.key)));
          travelTo(p, S.key);
          break;
        }
      }
    } else if (y < MIN_Y + 8) {
      // A predicted height is not proof that generation actually produced a safe surface.
      try {
        const target = { x, y: Math.max(heightAt(W, Math.floor(x), Math.floor(z)), W.liquidLevel) + 1, z };
        const { state, buffer, progress } = planetProvenance(W, chunkOf(x), chunkOf(z));
        if (!["inspecting", "building"].includes(state) && progress === undefined && !["building", "ready", "converting"].includes(buffer) && !isTravelPending(p) && isSafeStanding(p.dimension, target)) p.teleport(target, { checkForBlocks: true });
      } catch (err) {
        /* Unavailable or unsupported terrain is left to the loaded-area preparation path. */
      }
    }
  }

  if (busy || repairing) return;

  for (const p of players) {
    const W = BY_DIM.get(p.dimension.id);
    if (!W) continue;
    let dim;
    try {
      dim = world.getDimension(W.id);
    } catch (e) {
      continue;
    }
    const pcx = chunkOf(p.location.x);
    const pcz = chunkOf(p.location.z);
    for (const [dx, dz] of offsets(W.radius)) {
      const cx = pcx + dx;
      const cz = pcz + dz;
      const k = W.key + ":terrain:" + cx + "," + cz;
      if (!canRetry(k)) continue;
      const state = W.kind === "planet" ? world.getDynamicProperty(planetOwnership(W, cx, cz)) : undefined;
      if (W.kind === "planet" ? !["complete", "legacy", "protected"].includes(state) : chunkState(dim, cx, cz) === 0) {
        runExclusive(loaded => terrainFor(W, loaded, cx, cz), W, cx, cz);
        return;
      }
    }
    if (W.kind !== "planet") continue;
    for (const [dx, dz] of offsets(W.decorRadius)) {
      const cx = pcx + dx;
      const cz = pcz + dz;
      const k = W.key + ":decoration:" + cx + "," + cz;
      if (!canRetry(k)) continue;
      if (world.getDynamicProperty(planetOwnership(W, cx, cz)) !== "complete") continue;
      if (chunkState(dim, cx, cz) !== 1) continue;
      if (NEIGHBOURS.every(([nx, nz]) => chunkState(dim, cx + nx, cz + nz) >= 1)) {
        runExclusive(loaded => decorateJob(W, loaded, cx, cz), W, cx, cz, "decoration");
        return;
      }
    }
  }
}

// ---------------------------------------------------------------- messages

const tr = (key, ...args) => (args.length ? { translate: key, with: { rawtext: args } } : { translate: key });
const destName = (key) => ({ translate: "dbe.space.dest." + key });

// ---------------------------------------------------------------- travel

/** Removes a temporary ticking area; never throws (the area may already be gone). */
function removeArea(id) {
  releaseLoadedArea(id);
}

// Planet arrival only needs the 3x3 around the landing chunk; the scan generates radius 3 and decorates radius 2
// after arrival. Preparing 7x7 + 5x5 up front kept the player waiting for minutes with no feedback.
const PLANET_ARRIVAL_RADIUS = 1;
const PROGRESS_TICKS = 100;

async function prepareArea(W, dim, cx, cz, player) {
  const rad = W.kind === "space" ? W.prep : PLANET_ARRIVAL_RADIUS;
  const id = await acquireLoadedArea(dim,
    { x: (cx - rad) * 16, y: MIN_Y, z: (cz - rad) * 16 },
    { x: (cx + rad + 1) * 16 - 1, y: MIN_Y, z: (cz + rad + 1) * 16 - 1 },
    "space_planets.js: destination preparation");
  try {
    const chunks = offsets(rad);
    let done = 0, noticeAt = system.currentTick + PROGRESS_TICKS;
    const progress = () => {
      done++;
      if (!player || system.currentTick < noticeAt) return;
      noticeAt = system.currentTick + PROGRESS_TICKS;
      try { player.sendMessage(tr("dbe.space.progress", { text: String(done) }, { text: String(chunks.length) })); } catch (e) { /* player left */ }
    };
    for (const [dx, dz] of chunks) {
      const nx = cx + dx, nz = cz + dz;
      const state = W.kind === "planet" ? world.getDynamicProperty(planetOwnership(W, nx, nz)) : undefined;
      if (W.kind === "planet" ? !["complete", "legacy", "protected"].includes(state) : chunkState(dim, nx, nz) === 0) await runExclusive(loaded => terrainFor(W, loaded, nx, nz), W, nx, nz, "terrain", true);
      progress();
    }
    // Only the landing chunk is decorated before arrival (it holds the landing pad); its neighbours are generated above.
    if (W.kind === "planet" && world.getDynamicProperty(planetOwnership(W, cx, cz)) === "complete" && chunkState(dim, cx, cz) === 1 &&
        NEIGHBOURS.every(([nx, nz]) => chunkState(dim, cx + nx, cz + nz) >= 1)) {
      await runExclusive(loaded => decorateJob(W, loaded, cx, cz), W, cx, cz, "decoration", true);
    }
  } catch (e) {
    releaseLoadedArea(id);
    throw e;
  }
  return id;
}

/** Remembers where (dimension, exact position, facing) the player left from. Shared with the Namek pod. */
function saveOrigin(player, fromSky = false) {
  const dimId = player.dimension.id;
  if (dimId === U6_ID) {
    // leaving the arena for space: if the player came straight from a world, that spot is home
    try {
      const o = player.getDynamicProperty("dbe:u6_origin");
      if (typeof o === "string" && JSON.parse(o)?.d === "minecraft:overworld") player.setDynamicProperty(ORIGIN_PROP, o);
    } catch (e) {
      /* ignore */
    }
    return;
  }
  if (dimId === KAIOSHIN_ID) {
    // leaving Kaioshin for space: if the player came straight from a world, that spot is home
    try {
      const o = player.getDynamicProperty("dbe:kai_origin");
      if (typeof o === "string" && JSON.parse(o)?.d === "minecraft:overworld") player.setDynamicProperty(ORIGIN_PROP, o);
    } catch (e) {
      /* ignore */
    }
    return;
  }
  if (dimId !== "minecraft:overworld") return; // home must remain on Earth
  try {
    const { x, z } = player.location;
    let y = player.location.y;
    if (fromSky) {
      // remember the ground under the player, not a point 500 blocks up in the air
      let ground;
      try {
        ground = player.dimension.getTopmostBlock({ x: Math.floor(x), z: Math.floor(z) });
      } catch (e) {
        ground = undefined;
      }
      y = ground ? ground.location.y + 1 : Math.min(y, 100);
    }
    const r = player.getRotation();
    player.setDynamicProperty(ORIGIN_PROP, JSON.stringify({ d: dimId, x, y, z, rx: r.x, ry: r.y }));
  } catch (e) {
    console.warn("[Space] could not remember origin: " + e);
  }
}

async function sendHome(player) {
  if (travelling.has(player.id)) return;
  travelling.add(player.id);
  let phase = "origin";
  try {
    const raw = player.getDynamicProperty(ORIGIN_PROP);
    let savedOrigin;
    try { savedOrigin = typeof raw === "string" ? JSON.parse(raw) : undefined; } catch {}
    await safeReturnToEarth(player, { savedOrigin, label: "Space return to Earth" });
    phase = "teleport";
    if (raw !== undefined) player.setDynamicProperty(ORIGIN_PROP, undefined);
    player.sendMessage(tr("dbe.space.home"));
  } catch (error) {
    reportTravelFailure(player, "Space return", error, "minecraft:overworld", phase);
  } finally { travelling.delete(player.id); }
}

const travelling = new Set();

async function travelTo(player, key, opts = {}) {
  if (key === "kai") key = KAIOSHIN_KEY;
  if (travelling.has(player.id)) return;
  ensureBlocks();
  const pod = ridingPod(player);
  const podType = pod ? pod.typeId : POD_ID;
  if (key === "earth") {
    if (pod) dockPod(player, pod);
    sendHome(player);
    return;
  }
  if (key === "namek") {
    if (pod) dockPod(player, pod);
    // Namek is handled by namek_dimension.js
    try {
      saveOrigin(player);
      await player.runCommand("scriptevent dbe:namek");
    } catch (e) {
      reportTravelFailure(player, "Space " + key, e, NAMEK_ID, "dispatch");
    }
    return;
  }
  if (key === U6_KEY) {
    if (pod) dockPod(player, pod);
    // the arena is handled by universe_6_dimension.js (like Namek)
    try {
      saveOrigin(player, !!opts.atmosphere);
      await player.runCommand("scriptevent dbe:tournament");
    } catch (e) {
      reportTravelFailure(player, "Space " + key, e, U6_ID, "dispatch");
    }
    return;
  }
  if (key === KAIOSHIN_KEY) {
    if (pod) dockPod(player, pod);
    // Kaioshin is handled by kaioshin_dimension.js (like Namek and the arena)
    try {
      saveOrigin(player, !!opts.atmosphere);
      await player.runCommand("scriptevent dbe:kaioshin");
    } catch (e) {
      reportTravelFailure(player, "Space " + key, e, KAIOSHIN_ID, "dispatch");
    }
    return;
  }
  const W = WORLDS[key];
  if (!W) return;
  travelling.add(player.id);
  let areaId = null;
  let phase = "lookup";
  try {
    const dim = world.getDimension(W.id);
    phase = "generation";
    const origin = travelOrigin(player);
    saveOrigin(player, !!opts.atmosphere);
    player.sendMessage(tr("dbe.space.launching", destName(key)));
    let target;
    if (W.kind === "space") target = SPACE_STATION;
    else {
      const s = findSpawn(W);
      target = { x: s.x + 0.5, y: s.y + 1, z: s.z + 0.5 };
    }
    areaId = await prepareArea(W, dim, chunkOf(target.x), chunkOf(target.z), player);
    if (W.kind === "planet") {
      const { state, buffer, progress } = planetProvenance(W, chunkOf(target.x), chunkOf(target.z));
      if (["inspecting", "building"].includes(state) || progress !== undefined || ["building", "ready", "converting"].includes(buffer)) throw new Error(W.key + " arrival terrain remains incomplete; the player was kept at the origin. Review generation diagnostics before retrying");
    }
    phase = "teleport";
    // Fixed arrival point, prepared independently of the player: moving or flying meanwhile does not cancel the trip;
    // only leaving the origin dimension does. The return point was saved before the preparation.
    await safeTeleport(player, target, { origin, requireGround: true, dimension: dim, maxDrift: Infinity });
    if (pod) {
      try {
        pod.remove();
      } catch (err) {
        /* already gone */
      }
    }
    player.sendMessage(tr("dbe.space.arrived", destName(key)));
    if (pod) {
      // the pod follows you: a fresh one is waiting under your feet
      await waitTicks(5);
      try {
        const np = dim.spawnEntity(podType, { x: target.x, y: target.y, z: target.z });
        np.getComponent("minecraft:rideable")?.addRider(player);
      } catch (err) {
        console.warn("[Space] could not re-seat pod: " + err);
        try {
          player.getComponent("minecraft:inventory").container.addItem(new mc.ItemStack(podType, 1));
        } catch (err2) {
          /* ignore */
        }
      }
    }
    if (areaId) await waitTicks(100); // keep the chunks loaded while the player arrives
  } catch (e) {
    try {
      reportTravelFailure(player, "Space " + key, e, W.id, phase);
    } catch (e2) {
      /* ignore */
    }
  } finally {
    if (areaId) removeArea(areaId);
    travelling.delete(player.id);
  }
}

// ---------------------------------------------------------------- navigator menu

const menuOpen = new Set();

async function openMenu(player) {
  if (menuOpen.has(player.id)) return;
  if (travelling.has(player.id) || isTravelPending(player)) {
    // A destination is still being prepared: say so instead of ignoring the Navigator silently.
    try { player.sendMessage(tr("dbe.space.travel_busy")); } catch (e) { /* player left */ }
    return;
  }
  menuOpen.add(player.id);
  try {
    const here = player.dimension.id;
    const dests = DESTS.filter((k) => {
      if (k === "earth") return here !== "minecraft:overworld";
      if (k === "namek") return here !== NAMEK_ID;
      if (k === U6_KEY) return here !== U6_ID;
      if (k === KAIOSHIN_KEY) return here !== KAIOSHIN_ID;
      return WORLDS[k].id !== here;
    });
    const form = new ActionFormData().title({ translate: "dbe.space.menu.title" }).body({ translate: "dbe.space.menu.body" });
    for (const k of dests) form.button(destName(k));
    let res;
    for (let attempt = 0; attempt < 10; attempt++) {
      res = await form.show(player);
      if (res.cancelationReason !== "UserBusy") break; // chat / another menu was open: try again shortly
      await waitTicks(10);
    }
    if (!res || res.canceled) return;
    // travelTo marks the player as travelling synchronously; the menu itself is released before the
    // (possibly long) preparation so the Navigator never stays locked until the world is reloaded.
    const travel = travelTo(player, dests[res.selection]);
    menuOpen.delete(player.id);
    await travel;
  } catch (e) {
    console.warn("[Space] menu failed: " + e);
  } finally {
    menuOpen.delete(player.id);
  }
}

// ---------------------------------------------------------------- setup

// Physical IDs defined only by BP dimensions/*.json (no script fallback since 1.7.10). Diagnostic only:
// a missing one is named in the Content Log instead of surfacing later as a generic travel lookup failure.
const BP_DIMENSIONS = [
  ["dbe:vegeta", "Vegeta"], ["dbe:frieza_planet", "Frieza"], ["dbe:yardrat", "Yardrat"], ["dbe:kai", "Kaioshin"],
  ["dbe:universe_6_arena", "Universe 6 arena"], ["dbe:hell", "Hell"], ["dbe:space", "Space"], ["dbe:namek", "Namek"],
];
function auditBpDimensions() {
  const loaded = [];
  for (const [id, label] of BP_DIMENSIONS) {
    let dim, failure;
    try {
      dim = world.getDimension(id);
    } catch (e) {
      failure = e;
    }
    if (!dim) {
      console.error("[World] BP dimension " + id + " (" + label + ") is NOT loaded; check dimensions/*.json, format_version and world experiments: " + (failure ?? "getDimension returned nothing"));
      continue;
    }
    let height = "?";
    try {
      height = dim.heightRange ? dim.heightRange.min + ".." + dim.heightRange.max : "?";
    } catch (e) {
      /* diagnostic only */
    }
    loaded.push(id + "[" + height + "]");
  }
  console.warn("[World] BP dimensions loaded " + loaded.length + "/" + BP_DIMENSIONS.length + ": " + loaded.join(", "));
}

try {
  // The four BP dimension definitions are authoritative; do not register a second definition.
  world.afterEvents.worldLoad.subscribe(() => {
    try {
      auditBpDimensions();
    } catch (e) {
      console.warn("[World] BP dimension audit failed: " + e);
    }
    world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
      if (initialSpawn || !player.hasTag(DEAD_TAG)) return;
      rescueUntil.set(player.id, system.currentTick + 600);
    });
    system.runInterval(() => {
      try {
        scan();
      } catch (e) {
        console.warn("[Space] scan error: " + e);
      }
    }, SCAN_TICKS);

    const lastUse = new Map();
    world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
      if (!itemStack || itemStack.typeId !== NAVIGATOR_ITEM) return;
      if (system.currentTick - (lastUse.get(source.id) ?? -1000) < 20) return;
      lastUse.set(source.id, system.currentTick);
      openMenu(source);
    });

    system.afterEvents.scriptEventReceive.subscribe((ev) => {
      if (ev.id !== "dbe:space") return;
      const src = ev.sourceEntity;
      if (!src || src.typeId !== "minecraft:player") return;
      const key = (ev.message || "").trim().toLowerCase();
      if (key === "debug") {
        const W = BY_DIM.get(src.dimension.id);
        const out = ["§e[Space debug] dimension: " + src.dimension.id + (W ? "" : " (not a space world)")];
        if (W) {
          const d = src.dimension;
          const cx = chunkOf(src.location.x);
          const cz = chunkOf(src.location.z);
          out.push("chunk " + cx + "," + cz + " state=" + chunkState(d, cx, cz) + " (0 = needs terrain, 1 = terrain, 2 = decorated, -1 = not loaded)");
          out.push("busy=" + busy + ", retries pending=" + retryAt.size + ", fallback blocks=" + (usedFallback.has(W.key) ? "YES" : "no"));
          if (W.kind === "planet") out.push("top=" + W.top + " (" + (blockExists(W.top) ? "ok" : "MISSING") + ") stone=" + W.stone + " (" + (blockExists(W.stone) ? "ok" : "MISSING") + ")");
        }
        out.push("last error: " + lastError);
        for (const l of out) src.sendMessage(l);
        return;
      }
      if (DESTS.includes(key) || key === "kai") travelTo(src, key);
      else src.sendMessage("§e/scriptevent dbe:space <" + DESTS.join("|") + "|debug>");
    });
  });
} catch (e) {
  console.warn("[Space] setup failed: " + e);
}

// exposed for offline testing only
export const __testing = { ensureBlocks, usedFallback, scan, WORLDS, SPHERES, terrainJob, decorateJob, spaceJob, findSpawn, heightAt, chunkState, SPACE_Y };
