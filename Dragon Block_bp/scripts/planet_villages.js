/**
 * Planet villages for the space system (space_planets.js).
 *
 *   Vegeta         Saiyan villages     - blackstone bunkers around an obelisk, HOSTILE villagers (dbe:saiyan_villager)
 *   Frieza Planet  Frieza-race villages - white/purple domes and an amethyst spire, HOSTILE villagers (dbe:frieza_villager)
 *   Hell           Hell villages       - nether-brick bunkers, NEUTRAL villagers that fight (and call neighbours) only when hit (dbe:hell_villager)
 *   Yardrat        Yardrat villages    - round pink huts around a fountain, PEACEFUL villagers that fight back
 *                                        (and call their neighbours) when hit (dbe:yardrat_villager)
 *
 * How it works
 *   The planets are void dimensions that space_planets.js builds chunk by chunk. A village is a deterministic
 *   function of (planet, 160-block cell): the same site, layout and blocks come out no matter which chunk asks.
 *   decorateJob() calls buildVillagesInChunk() for every chunk it decorates and each chunk only writes the part of
 *   the village that lies inside it ("clipped" drawing), so a village can be much larger than one chunk without ever
 *   touching an unloaded chunk. No random numbers are consumed while drawing (everything is position-hashed), so
 *   clipping can never make two chunks disagree about a block.
 *
 *   Villagers are spawned once, by the chunk that contains their spawn point (de-duplicated against entities
 *   already standing there).
 *
 *   Every village also gets ONE dbe:demonic_iron_golem (spawnVillageGolem): it guards the plaza, fights back when hit and
 *   hunts any player who attacked a villager (see the GOLEM section at the bottom).
 *
 * Tuning knobs: CELL (village spacing), VILLAGE_CHANCE, the PCT table at the bottom (how hard hostile villagers hit),
 * and the STYLES palettes.
 */
import * as mc from "@minecraft/server";

const { world, system, BlockVolume } = mc;

const AIR = "minecraft:air";
const CELL = 160; // one village candidate per 160x160 block cell
const R_FLAT = 34; // radius that is levelled flat
const R_BLEND = 6; // extra radius blended back into the natural terrain
const R_ALL = R_FLAT + R_BLEND;
const TRIES = 24; // candidate sites tried per cell, the flattest one wins
// max height spread (blocks) allowed across a village site; Vegeta is all craters and hills, so it gets a looser limit
const MAX_RANGE = { vegeta: 13, frieza: 7, yardrat: 8, hell: 15 };
const VILLAGE_CHANCE = 0.85; // fraction of cells that get a village

const smooth = (t) => t * t * (3 - 2 * t);

// ---------------------------------------------------------------- palettes

const STYLES = {
  vegeta: {
    villager: "dbe:saiyan_villager",
    road: "minecraft:polished_blackstone",
    road2: "minecraft:blackstone",
    plaza: "minecraft:polished_blackstone_bricks",
    plaza2: "minecraft:red_nether_bricks",
    wall: "minecraft:polished_blackstone_bricks",
    wall2: "minecraft:red_nether_bricks",
    floor: "minecraft:polished_blackstone",
    roof: "minecraft:blackstone",
    parapet: "minecraft:polished_blackstone_bricks",
    glass: "minecraft:iron_bars",
    light: "minecraft:glowstone",
    carpet: "minecraft:red_carpet",
    prop: "minecraft:blast_furnace",
    accent: "minecraft:chiseled_polished_blackstone",
  },
  frieza: {
    villager: "dbe:frieza_villager",
    road: "minecraft:purple_concrete",
    road2: "minecraft:light_gray_concrete",
    plaza: "minecraft:white_concrete",
    plaza2: "minecraft:purple_concrete",
    wall: "minecraft:white_concrete",
    wall2: "minecraft:purple_concrete",
    floor: "minecraft:smooth_quartz",
    roof: "minecraft:white_concrete",
    parapet: "minecraft:purple_concrete",
    glass: "minecraft:purple_stained_glass",
    light: "minecraft:sea_lantern",
    carpet: "minecraft:purple_carpet",
    prop: "minecraft:smithing_table",
    accent: "minecraft:amethyst_block",
  },
  yardrat: {
    villager: "dbe:yardrat_villager",
    road: "minecraft:pink_terracotta",
    road2: "minecraft:white_terracotta",
    plaza: "minecraft:smooth_quartz",
    plaza2: "minecraft:pink_concrete",
    wall: "minecraft:white_concrete",
    wall2: "minecraft:pink_concrete",
    floor: "minecraft:smooth_quartz",
    roof: "minecraft:pink_terracotta",
    parapet: "minecraft:pink_concrete",
    glass: "minecraft:glass",
    light: "minecraft:sea_lantern",
    carpet: "minecraft:pink_carpet",
    prop: "minecraft:cartography_table",
    accent: "minecraft:cherry_planks",
  },
  // Hell (hell_dimension.js): red nether-brick and blackstone bunkers, NEUTRAL villagers that only fight when hit
  hell: {
    villager: "dbe:hell_villager",
    road: "minecraft:polished_blackstone",
    road2: "minecraft:blackstone",
    plaza: "minecraft:polished_blackstone_bricks",
    plaza2: "minecraft:red_nether_bricks",
    wall: "minecraft:red_nether_bricks",
    wall2: "minecraft:polished_blackstone_bricks",
    floor: "minecraft:polished_blackstone",
    roof: "minecraft:nether_bricks",
    parapet: "minecraft:polished_blackstone_bricks",
    glass: "minecraft:iron_bars",
    light: "minecraft:shroomlight",
    carpet: "minecraft:red_carpet",
    prop: "minecraft:blast_furnace",
    accent: "minecraft:gilded_blackstone",
  },
};

// ---------------------------------------------------------------- environment (injected by space_planets.js)

let env = null;
// planets that live outside space_planets.js (Hell) bring their own terrain functions
const planetEnv = new Map();
const hAt = (P, x, z) => (planetEnv.get(P.key) ?? env).heightAt(P, x, z);
const nSp = (P, x, z, r) => (planetEnv.get(P.key) ?? env).nearSpawn(P, x, z, r);

function put(dim, x, y, z, id) {
  try {
    dim.setBlockType({ x, y, z }, id);
  } catch (e) {
    /* unloaded / invalid: skip */
  }
}

function tryFill(dim, x1, y1, z1, x2, y2, z2, id) {
  try {
    dim.fillBlocks(new BlockVolume({ x: x1, y: y1, z: z1 }, { x: x2, y: y2, z: z2 }), id);
  } catch (e) {
    /* ignore */
  }
}

// ---------------------------------------------------------------- village sites

const siteCache = new Map();

/** Deterministic village site of a 160x160 cell, or null (also null for planets without a village style). */
function siteFor(P, ci, cj) {
  // env comes from initVillages() (space_planets.js); until then no site is known, and nothing is cached
  if (!STYLES[P.key] || !env) return null;
  const key = P.key + ":" + ci + ":" + cj;
  if (siteCache.has(key)) return siteCache.get(key);
  let site = null;
  if (env.hash2(ci * 7 + 3, cj * 11 + 5, P.seed + 900) < VILLAGE_CHANCE) {
    const minDry = P.liquid ? P.liquidLevel + 2 : -999;
    let best = null;
    for (let k = 0; k < TRIES && !(best && best.range <= 2); k++) {
      const x = ci * CELL + 44 + Math.floor(env.hash2(ci * 31 + k, cj * 17 - k, P.seed + 101) * (CELL - 88));
      const z = cj * CELL + 44 + Math.floor(env.hash2(ci * 13 - k, cj * 29 + k, P.seed + 202) * (CELL - 88));
      if (nSp(P, x, z, R_ALL + 16)) continue;
      let lo = 999;
      let hi = -999;
      let sum = 0;
      let n = 0;
      for (let dx = -R_FLAT; dx <= R_FLAT; dx += 6) {
        for (let dz = -R_FLAT; dz <= R_FLAT; dz += 6) {
          if (Math.hypot(dx, dz) > R_FLAT) continue;
          const h = hAt(P, x + dx, z + dz);
          if (h < lo) lo = h;
          if (h > hi) hi = h;
          sum += h;
          n++;
        }
      }
      if (lo < minDry || hi - lo > (MAX_RANGE[P.key] ?? 7)) continue;
      const range = hi - lo;
      if (!best || range < best.range) best = { x, z, y: Math.round(sum / n), range };
    }
    if (best) {
      site = { key, x: best.x, z: best.z, y: Math.max(best.y, minDry), seed: Math.floor(env.hash2(ci, cj, P.seed + 7) * 1e9), range: best.range };
    }
  }
  siteCache.set(key, site);
  return site;
}

/** True if (x, z) is inside (or within `margin` blocks of) any village on this planet. */
function villageNear(P, x, z, margin = 0) {
  if (!STYLES[P.key]) return false;
  const r = R_ALL + margin;
  for (let ci = Math.floor((x - r) / CELL); ci <= Math.floor((x + r) / CELL); ci++) {
    for (let cj = Math.floor((z - r) / CELL); cj <= Math.floor((z + r) / CELL); cj++) {
      const s = siteFor(P, ci, cj);
      if (s && Math.hypot(x - s.x, z - s.z) <= r) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------- clipped drawing context

const idChecks = new Map();
function okId(id) {
  if (id === AIR) return id;
  let v = idChecks.get(id);
  if (v === undefined) {
    v = env.blockExists(id) ? id : "minecraft:stone_bricks";
    idChecks.set(id, v);
  }
  return v;
}

/**
 * Drawing context for one village inside one chunk. Coordinates are relative to the village centre:
 * dx / dz from the centre, dy = 0 is the ground surface block.
 */
function makeCtx(c, site, S) {
  const { dim, P } = c;
  const bx0 = c.x0;
  const bz0 = c.z0;
  const bx1 = c.x0 + 15;
  const bz1 = c.z0 + 15;
  const D = {
    c,
    dim,
    P,
    site,
    S,
    bx0,
    bz0,
    bx1,
    bz1,
    inside(x, z) {
      return x >= bx0 && x <= bx1 && z >= bz0 && z <= bz1;
    },
    set(dx, dy, dz, id) {
      const x = site.x + dx;
      const z = site.z + dz;
      if (x < bx0 || x > bx1 || z < bz0 || z > bz1) return;
      put(dim, x, site.y + dy, z, okId(id));
    },
    box(dx1, dy1, dz1, dx2, dy2, dz2, id) {
      const x1 = Math.max(bx0, site.x + Math.min(dx1, dx2));
      const x2 = Math.min(bx1, site.x + Math.max(dx1, dx2));
      const z1 = Math.max(bz0, site.z + Math.min(dz1, dz2));
      const z2 = Math.min(bz1, site.z + Math.max(dz1, dz2));
      if (x1 > x2 || z1 > z2) return;
      tryFill(dim, x1, site.y + Math.min(dy1, dy2), z1, x2, site.y + Math.max(dy1, dy2), z2, okId(id));
    },
    /** position-hashed 0..1 (never consumes shared random state, so clipping cannot change results) */
    noise(dx, dz, salt = 0) {
      return env.hash2(site.x + dx, site.z + dz + salt * 7919, site.seed);
    },
    spawn(type, dx, dy, dz) {
      const x = site.x + dx;
      const z = site.z + dz;
      if (!D.inside(x, z)) return;
      const loc = { x: x + 0.5, y: site.y + dy, z: z + 0.5 };
      try {
        if (dim.getEntities({ type, location: loc, maxDistance: 1.5 }).length > 0) return;
        dim.spawnEntity(type, loc);
      } catch (e) {
        /* chunk not ready: skip */
      }
    },
    chest(dx, dy, dz, table) {
      const x = site.x + dx;
      const z = site.z + dz;
      if (!D.inside(x, z)) return;
      try {
        env.lootChest(dim, x, site.y + dy, z, table, env.mulberry32(x * 31 + z * 17 + site.seed));
      } catch (e) {
        /* ignore */
      }
    },
  };
  return D;
}

/** A frame whose local +z is the "front" (door side). Local coordinates (lx, lz) are mapped to village-relative ones. */
function frame(D, hx, hz, fx, fz) {
  const rx = -fz;
  const rz = fx;
  const W = (lx, lz) => [hx + lx * rx + lz * fx, hz + lx * rz + lz * fz];
  return {
    D,
    set(lx, y, lz, id) {
      const [x, z] = W(lx, lz);
      D.set(x, y, z, id);
    },
    box(lx1, y1, lz1, lx2, y2, lz2, id) {
      const [xa, za] = W(lx1, lz1);
      const [xb, zb] = W(lx2, lz2);
      D.box(xa, y1, za, xb, y2, zb, id);
    },
    spawn(lx, y, lz) {
      const [x, z] = W(lx, lz);
      D.spawn(D.S.villager, x, y, z);
    },
    chest(lx, y, lz, table) {
      const [x, z] = W(lx, lz);
      D.chest(x, y, z, table);
    },
    noise(lx, lz, salt) {
      const [x, z] = W(lx, lz);
      return D.noise(x, z, salt);
    },
  };
}

// ---------------------------------------------------------------- shared building blocks

function* levelTerrain(D) {
  const { P, dim, site, bx0, bz0, bx1, bz1 } = D;
  for (let x = bx0; x <= bx1; x++) {
    for (let z = bz0; z <= bz1; z++) {
      const d = Math.hypot(x - site.x, z - site.z);
      if (d > R_ALL) continue;
      const h = hAt(P, x, z);
      let target = site.y;
      if (d > R_FLAT) {
        if (P.liquid && h <= P.liquidLevel + 1) continue; // never dig into water / lava on the rim
        const t = smooth((d - R_FLAT) / R_BLEND);
        target = Math.round(site.y + (h - site.y) * t);
      }
      if (h > target) tryFill(dim, x, target + 1, z, x, h, z, AIR);
      else if (h < target) tryFill(dim, x, h + 1, z, x, target - 1, z, okId(P.sub));
      put(dim, x, target, z, okId(P.top));
    }
    yield;
  }
}

function roads(D) {
  const { S } = D;
  for (let k = -32; k <= 32; k++) {
    if (Math.abs(k) <= 9) continue; // the plaza covers the middle
    for (let w = -1; w <= 1; w++) {
      const edge = Math.abs(w) === 1;
      const wob = D.noise(k, w, 1) < 0.12;
      D.set(k, 0, w, edge || wob ? S.road2 : S.road);
      D.set(w, 0, k, edge || wob ? S.road2 : S.road);
    }
  }
  // lamp posts
  for (const k of [-28, -20, -12, 12, 20, 28]) {
    for (const [px, pz] of [[k, 2], [k, -2], [2, k], [-2, k]]) {
      D.box(px, 1, pz, px, 3, pz, S.wall2);
      D.set(px, 4, pz, S.light);
    }
  }
}

function disc(D, r, y, id, filter) {
  const R = Math.ceil(r);
  for (let dx = -R; dx <= R; dx++) {
    for (let dz = -R; dz <= R; dz++) {
      if (Math.hypot(dx, dz) <= r && (!filter || filter(dx, dz))) D.set(dx, y, dz, id);
    }
  }
}

function plazaBase(D) {
  const { S } = D;
  for (let dx = -9; dx <= 9; dx++) {
    for (let dz = -9; dz <= 9; dz++) {
      const d = Math.hypot(dx, dz);
      if (d > 8.7) continue;
      const ring = d > 7.2 || (d > 3.6 && d < 4.4);
      D.set(dx, 0, dz, ring || (dx + dz) % 5 === 0 ? S.plaza2 : S.plaza);
    }
  }
}

function ball(D, cx, cy, cz, r, id, hollowFrom) {
  const R = Math.ceil(r);
  for (let dx = -R; dx <= R; dx++) {
    for (let dy = -R; dy <= R; dy++) {
      for (let dz = -R; dz <= R; dz++) {
        const d = Math.hypot(dx, dy, dz);
        if (d > r) continue;
        if (hollowFrom !== undefined && d < hollowFrom) D.set(cx + dx, cy + dy, cz + dz, AIR);
        else D.set(cx + dx, cy + dy, cz + dz, id);
      }
    }
  }
}

// ---------------------------------------------------------------- Vegeta (Saiyan)

function vegetaPlaza(D) {
  const { S } = D;
  plazaBase(D);
  // obelisk
  D.box(-2, 1, -2, 2, 1, 2, S.wall);
  D.box(-1, 2, -1, 1, 4, 1, S.wall);
  D.box(0, 5, 0, 0, 10, 0, S.accent);
  D.set(0, 11, 0, "minecraft:netherrack");
  D.set(0, 12, 0, "minecraft:fire");
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) D.set(sx * 2, 2, sz * 2, "minecraft:magma");
  // corner braziers
  for (const [sx, sz] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) {
    D.box(sx, 1, sz, sx, 2, sz, S.wall2);
    D.set(sx, 3, sz, "minecraft:netherrack");
    D.set(sx, 4, sz, "minecraft:fire");
  }
  for (const [x, z] of [[-4, 0], [4, 0], [0, 4], [0, -4], [3, 3], [-3, -3]]) D.spawn(S.villager, x, 1, z);
}

function saiyanHouse(D, hx, hz, fx, fz, variant) {
  const { S } = D;
  const F = frame(D, hx, hz, fx, fz);
  F.box(-3, 0, -3, 3, 0, 3, S.floor);
  F.box(-3, 1, -3, 3, 4, 3, S.wall);
  F.box(-2, 1, -2, 2, 4, 2, AIR);
  for (const sx of [-3, 3]) for (const sz of [-3, 3]) F.box(sx, 1, sz, sx, 5, sz, S.wall2);
  F.box(-3, 5, -3, 3, 5, 3, S.roof);
  for (let lx = -3; lx <= 3; lx++) {
    for (let lz = -3; lz <= 3; lz++) {
      if ((Math.abs(lx) === 3 || Math.abs(lz) === 3) && (lx + lz) % 2 === 0) F.set(lx, 6, lz, S.parapet);
    }
  }
  F.box(0, 1, 3, 0, 3, 3, AIR); // doorway
  for (const [wx, wz] of [[-3, 0], [3, 0], [0, -3]]) F.box(wx, 2, wz, wx, 3, wz, S.glass);
  F.set(0, 4, 0, S.light);
  F.box(-1, 1, -1, 1, 1, 1, S.carpet);
  F.set(-2, 1, -2, "minecraft:barrel");
  F.set(2, 1, -2, S.prop);
  if (variant) F.set(-2, 1, 2, "minecraft:crafting_table");
  F.box(0, 0, 4, 0, 0, 5, S.road);
  F.spawn(0, 1, 0);
  if (variant) F.spawn(1, 1, 1);
}

function saiyanTrainingHall(D, cx, cz) {
  const { S } = D;
  const F = frame(D, cx, cz, 0, 1);
  F.box(-5, 0, -5, 5, 0, 5, "minecraft:red_sand");
  F.box(-5, 0, -5, 5, 0, -5, S.wall);
  F.box(-5, 0, 5, 5, 0, 5, S.wall);
  F.box(-5, 0, -5, -5, 0, 5, S.wall);
  F.box(5, 0, -5, 5, 0, 5, S.wall);
  // low arena wall with gaps, pillars at the corners and mid-sides
  for (let k = -5; k <= 5; k++) {
    if (Math.abs(k) <= 1) continue;
    for (const [lx, lz] of [[k, -5], [k, 5], [-5, k], [5, k]]) F.box(lx, 1, lz, lx, 2, lz, S.wall);
  }
  for (const [lx, lz] of [[-5, -5], [5, -5], [-5, 5], [5, 5], [0, -5], [-5, 0], [5, 0]]) {
    F.box(lx, 1, lz, lx, 4, lz, S.wall2);
    F.set(lx, 5, lz, S.light);
  }
  // training dummies and weights
  for (const [lx, lz] of [[-3, -2], [3, -2], [0, -3]]) {
    F.box(lx, 1, lz, lx, 2, lz, "minecraft:hay_block");
    F.set(lx, 3, lz, "minecraft:carved_pumpkin");
  }
  F.set(-3, 1, 2, "minecraft:anvil");
  F.set(3, 1, 2, "minecraft:anvil");
  F.box(-1, 1, 3, 1, 1, 3, "minecraft:iron_block");
  for (const [lx, lz] of [[-1, 0], [1, 0], [0, 1], [2, 2]]) F.spawn(lx, 1, lz);
}

function saiyanWatchtower(D, cx, cz) {
  const { S } = D;
  const F = frame(D, cx, cz, 0, 1);
  F.box(-2, 0, -2, 2, 0, 2, S.floor);
  F.box(-2, 1, -2, 2, 13, 2, S.wall);
  F.box(-1, 1, -1, 1, 13, 1, AIR);
  for (const sx of [-2, 2]) for (const sz of [-2, 2]) F.box(sx, 1, sz, sx, 14, sz, S.wall2);
  F.box(0, 1, 2, 0, 2, 2, AIR); // door
  for (const y of [4, 8, 12]) {
    for (const [wx, wz] of [[-2, 0], [2, 0], [0, -2]]) F.box(wx, y, wz, wx, y + 1, wz, S.glass);
  }
  F.box(-3, 14, -3, 3, 14, 3, S.roof);
  for (let lx = -3; lx <= 3; lx++) {
    for (let lz = -3; lz <= 3; lz++) {
      if ((Math.abs(lx) === 3 || Math.abs(lz) === 3) && (lx + lz) % 2 === 0) F.set(lx, 15, lz, S.parapet);
    }
  }
  F.set(0, 15, 0, "minecraft:netherrack");
  F.set(0, 16, 0, "minecraft:fire");
  F.set(0, 1, 0, S.light);
  F.spawn(0, 1, 0);
}

function saiyanArmory(D, cx, cz) {
  const { S } = D;
  const F = frame(D, cx, cz, 0, 1);
  F.box(-4, 0, -3, 4, 0, 3, S.floor);
  F.box(-4, 1, -3, 4, 4, 3, S.wall);
  F.box(-3, 1, -2, 3, 4, 2, AIR);
  for (const sx of [-4, 4]) for (const sz of [-3, 3]) F.box(sx, 1, sz, sx, 5, sz, S.wall2);
  F.box(-4, 5, -3, 4, 5, 3, S.roof);
  F.box(0, 1, 3, 0, 3, 3, AIR);
  for (const wx of [-2, 2]) F.box(wx, 2, -3, wx, 3, -3, S.glass);
  F.set(0, 4, 0, S.light);
  F.set(-3, 1, -2, "minecraft:blast_furnace");
  F.set(3, 1, -2, "minecraft:smithing_table");
  F.chest(-3, 1, 0, "vegeta_ruins");
  F.chest(3, 1, 0, "crashed_pod");
  F.box(0, 0, 4, 0, 0, 6, S.road);
  F.spawn(0, 1, 0);
  F.spawn(2, 1, 1);
}

function saiyanPodBay(D, cx, cz) {
  const { S } = D;
  D.box(cx - 5, 0, cz - 5, cx + 5, 0, cz + 5, "minecraft:gray_concrete");
  D.box(cx - 4, 0, cz - 4, cx + 4, 0, cz + 4, "minecraft:light_gray_concrete");
  for (const [px, pz] of [[-2.5, -2.5], [2.5, 2], [-2, 3]]) {
    const ax = Math.round(cx + px);
    const az = Math.round(cz + pz);
    const R = 3;
    for (let dx = -R; dx <= R; dx++) {
      for (let dy = -R; dy <= R; dy++) {
        for (let dz = -R; dz <= R; dz++) {
          const d = Math.hypot(dx, dy, dz);
          if (dy < -1) continue;
          if (d <= 2.6 && d >= 1.7) {
            if (dy >= 1 && dx === 0 && dz >= 1) continue;
            D.set(ax + dx, 2 + dy, az + dz, dy === 0 && d > 2.2 ? "minecraft:glass" : "minecraft:light_gray_concrete");
          } else if (d < 1.7 && dy >= 0) D.set(ax + dx, 2 + dy, az + dz, AIR);
        }
      }
    }
    D.set(ax, 1, az, S.light);
  }
  for (const [lx, lz] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) D.set(cx + lx, 1, cz + lz, "minecraft:sea_lantern");
  D.chest(cx, 1, cz + 4, "crashed_pod");
  D.spawn(S.villager, cx + 1, 1, cz - 4);
  D.spawn(S.villager, cx - 4, 1, cz + 1);
}

// ---------------------------------------------------------------- Frieza planet

function friezaPlaza(D) {
  const { S } = D;
  plazaBase(D);
  disc(D, 4.2, 1, S.wall2);
  disc(D, 3.4, 2, S.wall);
  for (let k = 0; k < 13; k++) {
    const r = Math.max(0.6, 2.2 * (1 - k / 13));
    disc(D, r, 3 + k, k % 4 === 3 ? S.light : S.accent);
  }
  D.set(0, 16, 0, "minecraft:end_rod");
  D.set(0, 17, 0, "minecraft:end_rod");
  for (const [sx, sz] of [[-4, 0], [4, 0], [0, 4], [0, -4]]) D.set(sx, 1, sz, "minecraft:sea_lantern");
  for (const [sx, sz] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) {
    D.box(sx, 1, sz, sx, 3, sz, S.accent);
    D.set(sx, 4, sz, S.light);
  }
  for (const [x, z] of [[-6, 0], [6, 0], [0, 6], [0, -6], [5, 5]]) D.spawn(S.villager, x, 1, z);
}

function friezaDomeHouse(D, hx, hz, fx, fz, variant) {
  const { S } = D;
  const F = frame(D, hx, hz, fx, fz);
  const rOut = 4.3;
  const rIn = 3.3;
  for (let dy = 0; dy <= 5; dy++) {
    for (let lx = -5; lx <= 5; lx++) {
      for (let lz = -5; lz <= 5; lz++) {
        if (dy === 0) {
          const r2 = Math.hypot(lx, lz);
          if (r2 > rOut) continue;
          F.set(lx, 0, lz, r2 < rIn ? S.floor : S.wall2);
          continue;
        }
        const d = Math.hypot(lx, dy, lz);
        if (d > rOut) continue;
        if (d >= rIn) {
          if (lx === 0 && lz >= 3 && dy <= 2) continue; // doorway
          let id = S.wall;
          if (dy === 1) id = S.wall2;
          else if (dy === 2 && (lx + lz) % 2 === 0) id = S.glass;
          F.set(lx, dy, lz, id);
        } else {
          F.set(lx, dy, lz, AIR);
        }
      }
    }
  }
  F.set(0, 3, 0, S.light);
  F.box(-1, 1, -1, 1, 1, 1, S.carpet);
  F.set(-2, 1, -2, "minecraft:barrel");
  if (variant) F.set(2, 1, -2, S.prop);
  F.box(0, 0, 4, 0, 0, 5, S.road);
  F.box(0, 0, 3, 0, 0, 3, S.floor);
  F.spawn(0, 1, 0);
  if (variant) F.spawn(1, 1, 1);
}

function friezaCommandDome(D, cx, cz) {
  const { S } = D;
  const F = frame(D, cx, cz, 0, 1);
  const rOut = 5.5;
  const rIn = 4.5;
  for (let dy = 0; dy <= 6; dy++) {
    for (let lx = -6; lx <= 6; lx++) {
      for (let lz = -6; lz <= 6; lz++) {
        if (dy === 0) {
          const r2 = Math.hypot(lx, lz);
          if (r2 > rOut) continue;
          F.set(lx, 0, lz, r2 < rIn ? S.wall2 : S.wall);
          continue;
        }
        const d = Math.hypot(lx, dy, lz);
        if (d > rOut) continue;
        if (d >= rIn) {
          if (Math.abs(lx) <= 1 && lz >= 4 && dy <= 3) continue;
          let id = S.wall;
          if (dy === 1) id = S.wall2;
          else if (dy === 3 && (Math.abs(lx) + Math.abs(lz)) % 2 === 0) id = S.glass;
          F.set(lx, dy, lz, id);
        } else {
          F.set(lx, dy, lz, AIR);
        }
      }
    }
  }
  F.set(0, 4, 0, S.light);
  F.box(-1, 1, -4, 1, 1, -3, S.accent); // throne dais
  F.box(0, 2, -4, 0, 3, -4, S.accent);
  F.chest(-3, 1, -2, "frieza_outpost");
  F.chest(3, 1, -2, "frieza_outpost");
  F.box(0, 0, 5, 0, 0, 7, S.road);
  F.spawn(0, 1, -2);
  F.spawn(-2, 1, 1);
  F.spawn(2, 1, 1);
}

function friezaSpire(D, cx, cz) {
  const { S } = D;
  disc(D, 5, 0, S.wall2, (dx, dz) => true);
  const F = frame(D, cx, cz, 0, 1);
  for (let k = 0; k < 20; k++) {
    const r = Math.max(0.6, 2.6 * (1 - k / 20));
    const R = Math.ceil(r);
    for (let dx = -R; dx <= R; dx++) {
      for (let dz = -R; dz <= R; dz++) {
        if (dx * dx + dz * dz <= r * r + 0.3) D.set(cx + dx, 1 + k, cz + dz, k % 5 === 4 ? S.light : S.accent);
      }
    }
  }
  D.set(cx, 21, cz, "minecraft:end_rod");
  D.set(cx, 22, cz, "minecraft:end_rod");
  for (const [sx, sz] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) D.set(cx + sx, 1, cz + sz, S.light);
  F.spawn(3, 1, 3);
  F.spawn(-3, 1, 3);
}

function friezaLandingPad(D, cx, cz) {
  const { S } = D;
  D.box(cx - 5, 0, cz - 5, cx + 5, 0, cz + 5, S.wall2);
  D.box(cx - 4, 0, cz - 4, cx + 4, 0, cz + 4, S.wall);
  for (const [px, pz] of [[-2, -2], [2, 2]]) {
    const ax = cx + px;
    const az = cz + pz;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dz = -2; dz <= 2; dz++) {
          const d = Math.hypot(dx, dy, dz);
          if (dy < -1) continue;
          if (d <= 2.2 && d >= 1.2) {
            if (dy >= 1 && dx === 0 && dz >= 1) continue;
            D.set(ax + dx, 2 + dy, az + dz, dy === 0 && d > 1.8 ? S.glass : "minecraft:white_concrete");
          } else if (d < 1.2 && dy >= 0) D.set(ax + dx, 2 + dy, az + dz, AIR);
        }
      }
    }
    D.set(ax, 1, az, S.light);
  }
  for (const [lx, lz] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) {
    D.box(cx + lx, 1, cz + lz, cx + lx, 2, cz + lz, S.accent);
    D.set(cx + lx, 3, cz + lz, S.light);
  }
  D.chest(cx + 3, 1, cz - 3, "frieza_outpost");
  D.spawn(S.villager, cx, 1, cz + 3);
  D.spawn(S.villager, cx - 3, 1, cz);
}

// ---------------------------------------------------------------- Yardrat

function yardratPlaza(D) {
  const { S } = D;
  plazaBase(D);
  for (let dx = -4; dx <= 4; dx++) {
    for (let dz = -4; dz <= 4; dz++) {
      const d = Math.hypot(dx, dz);
      if (d < 2.6) D.set(dx, 0, dz, "minecraft:water");
      else if (d <= 3.6) {
        D.set(dx, 0, dz, S.wall);
        D.set(dx, 1, dz, S.wall2);
      }
    }
  }
  D.box(0, 0, 0, 0, 4, 0, "minecraft:cherry_log");
  ball(D, 0, 5, 0, 2.6, "minecraft:cherry_leaves");
  D.set(0, 4, 0, "minecraft:cherry_log");
  for (const [sx, sz] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) {
    D.box(sx, 1, sz, sx, 3, sz, "minecraft:cherry_log");
    D.set(sx, 4, sz, S.light);
  }
  for (const [x, z] of [[-6, 0], [6, 0], [0, 6], [0, -6], [5, 5], [-5, -5]]) D.spawn(S.villager, x, 1, z);
}

function yardratHut(D, hx, hz, fx, fz, variant) {
  const { S } = D;
  const F = frame(D, hx, hz, fx, fz);
  for (let lx = -5; lx <= 5; lx++) {
    for (let lz = -5; lz <= 5; lz++) {
      const r = Math.hypot(lx, lz);
      if (r <= 3.6) F.set(lx, 0, lz, S.floor);
      for (let dy = 1; dy <= 3; dy++) {
        if (r > 3.6) continue;
        if (r >= 2.6) {
          if (lx === 0 && lz >= 3 && dy <= 2) continue; // door
          let id = dy === 1 ? S.wall2 : S.wall;
          if (dy === 2 && ((Math.abs(lx) === 3 && lz === 0) || (lx === 0 && lz === -3))) id = S.glass;
          F.set(lx, dy, lz, id);
        } else F.set(lx, dy, lz, AIR);
      }
      // cone roof
      const layers = [4.4, 3.4, 2.4, 1.4, 0.5];
      for (let i = 0; i < layers.length; i++) if (r <= layers[i]) F.set(lx, 4 + i, lz, i === layers.length - 1 ? S.light : S.roof);
    }
  }
  F.set(0, 3, 0, S.light);
  F.box(-1, 1, -1, 1, 1, 1, S.carpet);
  F.set(-2, 1, -1, "minecraft:barrel");
  if (variant) F.set(2, 1, -1, S.prop);
  F.box(0, 0, 4, 0, 0, 5, S.road);
  F.spawn(0, 1, 0);
  if (variant) F.spawn(1, 1, 1);
}

function yardratTemple(D, cx, cz) {
  const { S } = D;
  for (let dx = -6; dx <= 6; dx++) {
    for (let dz = -6; dz <= 6; dz++) {
      const r = Math.hypot(dx, dz);
      if (r <= 5.6) D.set(cx + dx, 0, cz + dz, r > 4.6 ? S.wall2 : S.floor);
    }
  }
  for (let a = 0; a < 8; a++) {
    const px = Math.round(Math.cos((a / 8) * Math.PI * 2) * 4.4);
    const pz = Math.round(Math.sin((a / 8) * Math.PI * 2) * 4.4);
    D.box(cx + px, 1, cz + pz, cx + px, 5, cz + pz, "minecraft:cherry_log");
    D.set(cx + px, 6, cz + pz, S.light);
  }
  for (let dx = -6; dx <= 6; dx++) {
    for (let dz = -6; dz <= 6; dz++) {
      const r = Math.hypot(dx, dz);
      if (r <= 5.4 && r >= 1.8) D.set(cx + dx, 5, cz + dz, r > 4.9 ? S.wall2 : S.roof);
    }
  }
  D.set(cx, 1, cz, "minecraft:chiseled_quartz_block");
  D.chest(cx, 2, cz, "yardrat_dome");
  for (const [lx, lz] of [[-2, 2], [2, 2], [0, -2]]) D.spawn(S.villager, cx + lx, 1, cz + lz);
}

function yardratGarden(D, cx, cz) {
  const { S } = D;
  for (let dx = -6; dx <= 6; dx++) {
    for (let dz = -6; dz <= 6; dz++) {
      const r = Math.hypot(dx, dz);
      if (r <= 5.5) D.set(cx + dx, 0, cz + dz, r > 4.6 ? S.road2 : S.road);
      if (r <= 3.6) {
        D.set(cx + dx, -1, cz + dz, "minecraft:water");
        D.set(cx + dx, 0, cz + dz, "minecraft:water");
        if (r > 2.2 && D.noise(dx, dz, 3) < 0.35) D.set(cx + dx, 1, cz + dz, "minecraft:lily_pad");
      } else if (r <= 4.5) {
        D.set(cx + dx, 0, cz + dz, S.wall2);
      }
    }
  }
  for (const [tx, tz, h] of [[-5, -4, 5], [5, 4, 6], [4, -5, 4]]) {
    D.box(cx + tx, 1, cz + tz, cx + tx, h, cz + tz, "minecraft:cherry_log");
    ball(D, cx + tx, h + 1, cz + tz, 2.4, "minecraft:cherry_leaves");
    D.set(cx + tx, h, cz + tz, "minecraft:cherry_log");
  }
  for (const [lx, lz] of [[-5, 3], [5, -2]]) D.spawn(S.villager, cx + lx, 1, cz + lz);
}

function yardratMarket(D, cx, cz) {
  const { S } = D;
  D.box(cx - 5, 0, cz - 5, cx + 5, 0, cz + 5, S.road2);
  for (let i = 0; i < 2; i++) {
    const z0 = cz - 4 + i * 6;
    for (const sx of [-4, 4]) {
      D.box(cx + sx, 1, z0, cx + sx, 3, z0, "minecraft:cherry_log");
      D.box(cx + sx, 1, z0 + 2, cx + sx, 3, z0 + 2, "minecraft:cherry_log");
    }
    for (let dx = -4; dx <= 4; dx++) {
      for (let dz = 0; dz <= 2; dz++) D.set(cx + dx, 4, z0 + dz, (dx + dz) % 2 === 0 ? "minecraft:pink_wool" : "minecraft:white_wool");
    }
    D.box(cx - 3, 1, z0 + 1, cx + 3, 1, z0 + 1, "minecraft:cherry_planks");
    D.set(cx - 2, 2, z0 + 1, "minecraft:barrel");
    D.set(cx + 2, 2, z0 + 1, "minecraft:barrel");
    D.set(cx, 2, z0 + 1, "minecraft:flower_pot");
    D.set(cx - 4, 4, z0 + 1, S.light);
    D.set(cx + 4, 4, z0 + 1, S.light);
    D.spawn(S.villager, cx, 1, z0 + 3 > cz + 5 ? z0 - 1 : z0 + 3);
  }
}

function yardratObservatory(D, cx, cz) {
  const { S } = D;
  const F = frame(D, cx, cz, 0, 1);
  const rOut = 5.5;
  const rIn = 4.5;
  for (let dy = 0; dy <= 6; dy++) {
    for (let lx = -6; lx <= 6; lx++) {
      for (let lz = -6; lz <= 6; lz++) {
        if (dy === 0) {
          const r2 = Math.hypot(lx, lz);
          if (r2 > rOut) continue;
          F.set(lx, 0, lz, r2 < rIn ? S.floor : S.wall2);
          continue;
        }
        const d = Math.hypot(lx, dy, lz);
        if (d > rOut) continue;
        if (d >= rIn) {
          if (Math.abs(lx) <= 1 && lz >= 4 && dy <= 3) continue;
          let id = S.wall;
          if (dy === 1) id = S.wall2;
          else if (dy >= 3 && (lx + lz + dy) % 3 === 0) id = S.glass;
          F.set(lx, dy, lz, id);
        } else F.set(lx, dy, lz, AIR);
      }
    }
  }
  F.set(0, 4, 0, S.light);
  F.box(-1, 1, -1, 1, 1, 1, S.carpet);
  F.chest(0, 1, -3, "yardrat_dome");
  F.box(0, 0, 5, 0, 0, 7, S.road);
  F.spawn(0, 1, 2);
  F.spawn(-2, 1, 0);
}

// ---------------------------------------------------------------- layout

const BUILDERS = {
  vegeta: { plaza: vegetaPlaza, house: saiyanHouse, specials: [saiyanTrainingHall, saiyanWatchtower, saiyanArmory, saiyanPodBay] },
  frieza: { plaza: friezaPlaza, house: friezaDomeHouse, specials: [friezaCommandDome, friezaSpire, friezaLandingPad, friezaCommandDome] },
  yardrat: { plaza: yardratPlaza, house: yardratHut, specials: [yardratTemple, yardratGarden, yardratMarket, yardratObservatory] },
  hell: { plaza: vegetaPlaza, house: saiyanHouse, specials: [saiyanTrainingHall, saiyanWatchtower, saiyanArmory, saiyanTrainingHall] },
};

// [x, z, front-x, front-z]: houses sit beside the two crossing roads and face them
const HOUSE_SLOTS = [
  [16, 7, 0, -1], [-16, 7, 0, -1], [16, -7, 0, 1], [-16, -7, 0, 1],
  [26, 7, 0, -1], [-26, 7, 0, -1], [26, -7, 0, 1], [-26, -7, 0, 1],
  [7, 16, -1, 0], [7, -16, -1, 0], [-7, 16, 1, 0], [-7, -16, 1, 0],
  [7, 26, -1, 0], [7, -26, -1, 0], [-7, 26, 1, 0], [-7, -26, 1, 0],
];
const SPECIAL_SLOTS = [[-20, -20], [20, -20], [-20, 20], [20, 20]];

// ---------------------------------------------------------------- demonic iron golem (one per village)

const GOLEM_ID = "dbe:demonic_iron_golem";
const GOLEM_SPOT = [-8, 0]; // plaza edge, offset from the village centre; free of obelisk / fountain / spire on every planet

function spawnVillageGolem(D) {
  const { dim, site } = D;
  if (D.P?.key !== "hell") return; // the demonic iron golem only guards the Hell villages
  const x = site.x + GOLEM_SPOT[0];
  const z = site.z + GOLEM_SPOT[1];
  if (!D.inside(x, z)) return;
  const flag = "dbe_golem:" + site.key; // remembers that this village already got its golem (even if it was killed later)
  try {
    if (world.getDynamicProperty(flag)) return;
  } catch (e) {
    /* ignore */
  }
  const loc = { x: x + 0.5, y: site.y + 1, z: z + 0.5 };
  try {
    if (dim.getEntities({ type: GOLEM_ID, location: loc, maxDistance: 48 }).length === 0) dim.spawnEntity(GOLEM_ID, loc);
    world.setDynamicProperty(flag, true);
  } catch (e) {
    /* chunk not ready: flag stays unset, a later pass retries */
  }
}

function layoutFor(P, site) {
  if (site.layout) return site.layout;
  const B = BUILDERS[P.key];
  const pieces = [];
  const add = (cx, cz, half, run) => pieces.push({ x1: site.x + cx - half, z1: site.z + cz - half, x2: site.x + cx + half, z2: site.z + cz + half, run });
  add(0, 0, 32, roads);
  add(0, 0, 10, B.plaza);
  HOUSE_SLOTS.forEach(([sx, sz, fx, fz], i) => {
    const h = env.hash2(i * 5 + 1, i * 3 + 2, site.seed);
    if (h < 0.78) add(sx, sz, 5, (D) => B.house(D, sx, sz, fx, fz, env.hash2(i, 77, site.seed) < 0.5));
  });
  const order = [0, 1, 2, 3].sort((a, b) => env.hash2(a, 5, site.seed) - env.hash2(b, 5, site.seed));
  SPECIAL_SLOTS.forEach(([sx, sz], i) => {
    const fn = B.specials[order[i]];
    add(sx, sz, 7, (D) => fn(D, sx, sz));
  });
  add(GOLEM_SPOT[0], GOLEM_SPOT[1], 0, (D) => spawnVillageGolem(D)); // runs after the plaza piece
  site.layout = pieces;
  return pieces;
}

/** Builds the part of every village that overlaps this chunk. Never throws (a village problem must not break the planet). */
function* buildVillagesInChunk(c) {
  const { P, x0, z0 } = c;
  const S = STYLES[P.key];
  if (!S || !env) return;
  try {
    for (let ci = Math.floor((x0 - R_ALL) / CELL); ci <= Math.floor((x0 + 15 + R_ALL) / CELL); ci++) {
      for (let cj = Math.floor((z0 - R_ALL) / CELL); cj <= Math.floor((z0 + 15 + R_ALL) / CELL); cj++) {
        const site = siteFor(P, ci, cj);
        if (!site) continue;
        // does the village circle touch this chunk?
        const nx = Math.max(x0, Math.min(site.x, x0 + 15));
        const nz = Math.max(z0, Math.min(site.z, z0 + 15));
        if (Math.hypot(nx - site.x, nz - site.z) > R_ALL) continue;
        const D = makeCtx(c, site, S);
        yield* levelTerrain(D);
        for (const piece of layoutFor(P, site)) {
          if (piece.x2 < x0 || piece.x1 > x0 + 15 || piece.z2 < z0 || piece.z1 > z0 + 15) continue;
          try {
            piece.run(D);
          } catch (e) {
            console.warn("[Villages] piece failed: " + e);
          }
          yield;
        }
      }
    }
  } catch (e) {
    console.warn("[Villages] chunk " + c.cx + "," + c.cz + " failed: " + e);
  }
}

// ---------------------------------------------------------------- public API

/** Lets a planet built outside space_planets.js (Hell) use the village system: { heightAt(P,x,z), nearSpawn(P,x,z,r) }. */
export function registerVillagePlanet(key, fns) {
  planetEnv.set(key, fns);
  return { near: villageNear, buildInChunk: buildVillagesInChunk, siteFor };
}

/** env = { heightAt, nearSpawn, hash2, mulberry32, blockExists, lootChest } */
export function initVillages(e) {
  env = e;
  return { near: villageNear, buildInChunk: buildVillagesInChunk, siteFor };
}

// ---------------------------------------------------------------- hostile / retaliating villagers: scaled melee damage
//
// The player in this add-on carries a huge scripted health pool, so plain vanilla melee damage would tickle.
// Villager hits therefore add a percentage of the victim's max health on top (never below `min`).

const PCT = {
  "dbe:saiyan_villager": { pct: 0, min: 600 },
  "dbe:frieza_villager": { pct: 0, min: 600 },
  "dbe:yardrat_villager": { pct: 0, min: 600 },
  "dbe:hell_villager": { pct: 0, min: 600 },
  // Frieza-tier golem: villager hit (600, level ~28) scaled to level 35 with strength 1.2 -> ~900. Tune freely.
  "dbe:demonic_iron_golem": { pct: 0, min: 900 },
};

try {
  world.afterEvents.worldLoad.subscribe(() => {
    world.afterEvents.entityHitEntity.subscribe((ev) => {
      const cfg = PCT[ev.damagingEntity?.typeId];
      if (!cfg) return;
      const t = ev.hitEntity;
      if (!t || t.typeId !== "minecraft:player") return;
      try {
        const hp = t.getComponent("minecraft:health");
        if (!hp) return;
        const dmg = Math.max(cfg.min, Math.floor(hp.effectiveMax * cfg.pct));
        t.applyDamage(dmg, { cause: "entityAttack", damagingEntity: ev.damagingEntity });
      } catch (e) {
        /* creative / dead / not applicable */
      }
    });
  });
} catch (e) {
  console.warn("[Villages] combat hook failed: " + e);
}

// ---------------------------------------------------------------- demonic iron golem: avenges the village
//
// A player who hurts a villager (or the golem itself) gets the "dbe_golem_enemy" tag. The golem's behaviour file hunts
// tagged players within 64 blocks, and its hurt_by_target behaviour covers anyone who hits it directly.
// The tag expires GOLEM_MEMORY_TICKS after the last offence (and is cleared when a player joins the world).

const GOLEM_TAG = "dbe_golem_enemy";
const GOLEM_MEMORY_TICKS = 6000; // 5 minutes
const VILLAGE_FOLK = new Set([
  "dbe:saiyan_villager",
  "dbe:frieza_villager",
  "dbe:yardrat_villager",
  "dbe:hell_villager",
  GOLEM_ID,
]);
const lastOffence = new Map(); // player id -> tick of the last attack on the village

try {
  world.afterEvents.worldLoad.subscribe(() => {
    world.afterEvents.entityHurt.subscribe((ev) => {
      if (!VILLAGE_FOLK.has(ev.hurtEntity?.typeId)) return;
      const attacker = ev.damageSource?.damagingEntity;
      if (!attacker || attacker.typeId !== "minecraft:player") return;
      try {
        attacker.addTag(GOLEM_TAG);
        lastOffence.set(attacker.id, system.currentTick);
      } catch (e) {
        /* player left */
      }
    });

    world.afterEvents.playerSpawn.subscribe((ev) => {
      if (!ev.initialSpawn) return;
      try {
        ev.player.removeTag(GOLEM_TAG);
      } catch (e) {
        /* ignore */
      }
    });

    system.runInterval(() => {
      if (lastOffence.size === 0) return;
      for (const [id, tick] of lastOffence) {
        if (system.currentTick - tick < GOLEM_MEMORY_TICKS) continue;
        lastOffence.delete(id);
        const player = world.getAllPlayers().find((p) => p.id === id);
        try {
          player?.removeTag(GOLEM_TAG);
        } catch (e) {
          /* ignore */
        }
      }
    }, 100);
  });
} catch (e) {
  console.warn("[Villages] golem hook failed: " + e);
}


// Demonic iron golems belong to Hell only: remove any that earlier versions left behind on the other planets/overworld.
system.runInterval(() => {
  for (const dimId of ["minecraft:overworld", "dbe:vegeta", "dbe:frieza_planet", "dbe:yardrat", "dbe:namek", "dbe:space"]) {
    try {
      for (const g of world.getDimension(dimId).getEntities({ type: GOLEM_ID })) g.remove();
    } catch (e) {
      /* dimension not loaded / no players there */
    }
  }
}, 200);
