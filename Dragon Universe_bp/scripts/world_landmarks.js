/**
 * Unique landmarks placed once per world from .mcstructure pieces (see relatorios/F_estruturas.md).
 *
 * Every landmark gets one random spot per world, saved in PLAN_PROP, on the surface of its dimension:
 *   - the spot is drawn the first time the script runs in a world and placed only when a player comes close;
 *   - before anything is written, the surface under the whole footprint is sampled and the footprint is searched for
 *     blocks a player or a village would have placed (PLACED_BLOCKS). A spot that fails is drawn again: nothing is
 *     written, so worlds created before this module keep what they have;
 *   - pieces are placed one at a time inside their own temporary loaded area, and the piece count is saved, so an
 *     interrupted placement resumes at the piece it stopped on;
 *   - whatever the lowest layer of the structure does not touch is filled down to the ground (FOUNDATION_DEPTH).
 *
 * Operators: /scriptevent dbe:landmarks            -> lists every spot and its state
 *            /scriptevent dbe:landmarks_retry key  -> unlocks a spot that gave up
 */
import * as mc from "@minecraft/server";
import { acquireLoadedArea, releaseLoadedArea } from "./travel_safety.js";

const { world, system, BlockVolume } = mc;

const OVERWORLD = "minecraft:overworld";
const PLAN_PROP = "dbe:world_landmarks"; // JSON { v, spots: { key: { x, z, y?, done?, placed?, tries?, rejects?, none? } } }
const PLAN_VERSION = 1;
const STRUCTURES_PROP = "dbe:world_structures"; // plan of world_structures.js, read only
const SCAN_TICKS = 40;
const PLACE_MARGIN = 64; // a player this close to the footprint (horizontally) triggers the placement
const MIN_SEPARATION = 400; // between the landmarks and the spots of world_structures.js
const MIN_DIST = 900; // overworld: distance range from the world spawn
const MAX_DIST = 3500;
const MAX_TRIES = 5; // placement errors before a spot gives up
const MAX_REJECTS = 12; // spots drawn again before a landmark gives up
const SAMPLE_STEP = 8; // blocks between surface samples
const MAX_WET = 0.1; // share of samples that may be liquid
const FOUNDATION_DEPTH = 48;

const LAND = ["minecraft:plains", "minecraft:sunflower_plains", "minecraft:forest", "minecraft:birch_forest", "minecraft:savanna", "minecraft:taiga", "dbe:dirtstone_plains", "dbe:west_forest"];

// Not part of any natural surface here. Found inside a footprint, they mean a player build or an existing structure.
const PLACED_BLOCKS = ["chest", "trapped_chest", "barrel", "ender_chest", "crafting_table", "furnace", "blast_furnace", "smoker", "bed", "torch",
  "lantern", "glass", "glass_pane", "oak_planks", "spruce_planks", "birch_planks", "jungle_planks", "acacia_planks", "dark_oak_planks", "mangrove_planks",
  "cherry_planks", "stone_bricks", "cobblestone", "bricks", "brick_block", "wooden_door", "iron_door", "spruce_door", "birch_door", "oak_fence", "spruce_fence",
  "white_wool", "white_concrete", "quartz_block", "smooth_quartz", "bookshelf", "lectern", "anvil", "enchanting_table", "hopper", "dispenser", "dropper", "lever",
  "redstone_wire", "rail", "ladder", "standing_sign", "wall_sign", "flower_pot", "composter", "bell", "purple_concrete", "polished_blackstone_bricks"]
  .map((id) => "minecraft:" + id);

const SOFT = /leaves|_log$|_wood$|vine|short_grass|tall_grass|fern|flower|poppy|dandelion|tulip|orchid|allium|bluet|daisy|cornflower|lily|peony|rose|lilac|snow_layer|mushroom|bush|azalea|sapling|dead_bush|bamboo|sugar_cane|cactus|pumpkin|melon|seagrass|kelp|moss_carpet|web|^minecraft:air$/;

const single = (id, size) => [{ id, dx: 0, dz: 0, ...size }];
/**
 * dim: "overworld" or a key of ENV. size: x, y, z of the assembled structure. pieces: structure ids with their offset.
 * biomes: overworld biomes to look for. maxRange: allowed height difference across the footprint. foundation: fill block.
 */
const SPECS = [
  { key: "piccolo_house", dim: "overworld", size: { x: 42, y: 27, z: 23 }, pieces: single("dbe:landmarks/piccolo_house", { x: 42, z: 23 }), biomes: LAND, maxRange: 8, foundation: "minecraft:dirt" },
  { key: "yamcha_house", dim: "overworld", size: { x: 26, y: 45, z: 25 }, pieces: single("dbe:landmarks/yamcha_house", { x: 26, z: 25 }), biomes: ["minecraft:desert"], maxRange: 8, foundation: "minecraft:sandstone" },
  { key: "red_ribbon_tower", dim: "overworld", size: { x: 33, y: 65, z: 32 }, pieces: single("dbe:landmarks/red_ribbon_tower", { x: 33, z: 32 }), biomes: LAND, maxRange: 8, foundation: "minecraft:dirt" },
];

const ENV = {};

const enabled = (spec) => !spec.enabled || spec.enabled();
const waitTicks = (n) => new Promise((resolve) => system.runTimeout(resolve, n));

function runJobAsync(gen) {
  return new Promise((resolve, reject) => {
    system.runJob((function* () {
      try {
        yield* gen;
        resolve();
      } catch (e) {
        reject(e);
      }
    })());
  });
}

function loadPlan() {
  try {
    const raw = world.getDynamicProperty(PLAN_PROP);
    const plan = typeof raw === "string" ? JSON.parse(raw) : null;
    if (plan && plan.v === PLAN_VERSION && plan.spots) return plan;
  } catch (e) {
    console.warn("[Landmarks] saved plan unreadable, planning again: " + e);
  }
  return { v: PLAN_VERSION, spots: {} };
}

const savePlan = (plan) => world.setDynamicProperty(PLAN_PROP, JSON.stringify(plan));

function structureSpots() {
  try {
    const raw = world.getDynamicProperty(STRUCTURES_PROP);
    return (typeof raw === "string" ? JSON.parse(raw) : {}).spots ?? {};
  } catch (e) {
    return {};
  }
}

const dimensionOf = (spec) => world.getDimension(spec.dim === "overworld" ? OVERWORLD : ENV[spec.dim].id);
const centerOf = (spec, spot) => ({ x: spot.x + spec.size.x / 2, z: spot.z + spec.size.z / 2 });

function spawnPoint() {
  try {
    const s = world.getDefaultSpawnLocation();
    return { x: s.x, z: s.z };
  } catch (e) {
    return { x: 0, z: 0 };
  }
}

/** Centers of every planned spot in this dimension, to keep the landmarks apart. */
function takenCenters(spec, plan) {
  const taken = [];
  for (const other of SPECS) {
    const s = plan.spots[other.key];
    if (other !== spec && other.dim === spec.dim && s && !s.none) taken.push(centerOf(other, s));
  }
  if (spec.dim === "overworld") for (const s of Object.values(structureSpots())) if (!s.none) taken.push(s);
  return taken;
}

const farFrom = (taken, x, z) => !taken.some((t) => Math.hypot(t.x - x, t.z - z) < MIN_SEPARATION);

function drawOverworld(spec, plan, dim) {
  const spawn = spawnPoint();
  const taken = takenCenters(spec, plan);
  const a = Math.random() * Math.PI * 2;
  const d = MIN_DIST + Math.random() * (MAX_DIST - MIN_DIST);
  const from = { x: Math.round(spawn.x + Math.cos(a) * d), y: 0, z: Math.round(spawn.z + Math.sin(a) * d) };
  let best;
  for (const biome of spec.biomes) {
    let p;
    try {
      p = dim.calculateClosestBiomeFromSeed(from, biome);
    } catch (e) {
      p = undefined; // biome unknown in this world type (e.g. flat world)
    }
    if (!p || !farFrom(taken, p.x, p.z)) continue;
    const dd = Math.hypot(p.x - from.x, p.z - from.z);
    if (!best || dd < best.d) best = { x: p.x, z: p.z, d: dd };
  }
  if (!best) return undefined;
  return { x: Math.round(best.x - spec.size.x / 2), z: Math.round(best.z - spec.size.z / 2) };
}

function draw(spec, plan, dim, rejects) {
  if (spec.draw) return spec.draw(spec, plan, rejects);
  return spec.dim === "overworld" ? drawOverworld(spec, plan, dim) : drawOnPlanet(spec, plan);
}

/** Heights of the planets are known without loading anything, so a bad spot is discarded here. */
function drawOnPlanet(spec, plan) {
  const env = ENV[spec.dim];
  const taken = takenCenters(spec, plan);
  for (let attempt = 0; attempt < 40; attempt++) {
    const a = Math.random() * Math.PI * 2;
    const d = 300 + Math.random() * 1200;
    const x = Math.round(Math.cos(a) * d);
    const z = Math.round(Math.sin(a) * d);
    if (!farFrom(taken, x, z)) continue;
    if (planetSurface(spec, env, { x, z })) return { x, z };
  }
  return undefined;
}

function planetSurface(spec, env, spot) {
  const heights = [];
  for (let x = spot.x; x <= spot.x + spec.size.x + SAMPLE_STEP - 1; x += SAMPLE_STEP) {
    for (let z = spot.z; z <= spot.z + spec.size.z + SAMPLE_STEP - 1; z += SAMPLE_STEP) {
      if (!env.clear(x, z)) return undefined;
      const h = env.surface(x, z);
      if (h <= env.sea + 1) return undefined;
      heights.push(h);
    }
  }
  return surfaceLevel(spec, heights);
}

/** The level the lowest layer sits on, or undefined when the ground is too uneven or the top leaves the world. */
function surfaceLevel(spec, heights) {
  heights.sort((a, b) => a - b);
  if (heights[heights.length - 1] - heights[0] > spec.maxRange) return undefined;
  const y = heights[heights.length >> 1];
  return y + spec.size.y > 319 ? undefined : y;
}

const pieceFrom = (spot, piece, y) => ({ x: spot.x + piece.dx, y, z: spot.z + piece.dz });
const pieceTo = (spot, piece, y, height) => ({ x: spot.x + piece.dx + piece.x - 1, y: y + height - 1, z: spot.z + piece.dz + piece.z - 1 });

async function withPieceArea(dim, spec, spot, piece, y, work) {
  const from = pieceFrom(spot, piece, y);
  const to = pieceTo(spot, piece, y, 1);
  const area = await acquireLoadedArea(dim, from, to, "landmark " + spec.key);
  try {
    return await work();
  } finally {
    releaseLoadedArea(area);
  }
}

function surfaceAt(dim, x, z) {
  let block = dim.getTopmostBlock({ x, z });
  while (block && !block.isLiquid && SOFT.test(block.typeId)) block = block.below();
  return block;
}

/** Samples the ground under one piece. Returns false when a sample is missing. */
function sampleSurface(dim, spot, piece, heights, wet) {
  for (let i = 0; i < piece.x; i += SAMPLE_STEP) {
    for (let j = 0; j < piece.z; j += SAMPLE_STEP) {
      const block = surfaceAt(dim, spot.x + piece.dx + i, spot.z + piece.dz + j);
      if (!block) return false;
      heights.push(block.location.y);
      if (block.isLiquid) wet.count++;
    }
  }
  return true;
}

/** True when a block from PLACED_BLOCKS stands where the piece would be written. */
async function pieceHasBuilds(dim, spec, spot, piece, y) {
  const top = y + spec.size.y - 1;
  for (let cx = spot.x + piece.dx; cx < spot.x + piece.dx + piece.x; cx += 16) {
    for (let cz = spot.z + piece.dz; cz < spot.z + piece.dz + piece.z; cz += 16) {
      const volume = new BlockVolume({ x: cx, y, z: cz }, {
        x: Math.min(cx + 15, spot.x + piece.dx + piece.x - 1),
        y: top,
        z: Math.min(cz + 15, spot.z + piece.dz + piece.z - 1),
      });
      if (dim.getBlocks(volume, { includeTypes: PLACED_BLOCKS }, true).getCapacity() > 0) return true;
      await waitTicks(1);
    }
  }
  return false;
}

/** Decides the height of a drawn spot. Returns undefined when the spot has to be drawn again. */
async function chooseLevel(dim, spec, spot) {
  const env = ENV[spec.dim];
  let y;
  if (env) {
    y = planetSurface(spec, env, spot);
    if (y === undefined) return undefined;
    const first = (v) => Math.floor(v / 16);
    const ready = await env.prepare(first(spot.x), first(spot.z), first(spot.x + spec.size.x - 1), first(spot.z + spec.size.z - 1));
    if (!ready) return undefined;
  } else {
    const heights = [];
    const wet = { count: 0 };
    for (const piece of spec.pieces) {
      if (!(await withPieceArea(dim, spec, spot, piece, -64, async () => sampleSurface(dim, spot, piece, heights, wet)))) return undefined;
      await waitTicks(1);
    }
    if (!heights.length || wet.count / heights.length > MAX_WET) return undefined;
    y = surfaceLevel(spec, heights);
    if (y === undefined) return undefined;
  }
  for (const piece of spec.pieces) {
    if (await withPieceArea(dim, spec, spot, piece, y, () => pieceHasBuilds(dim, spec, spot, piece, y))) return undefined;
  }
  return y;
}

/** Fills the columns under the lowest layer of a piece. Only air, liquid and plants are replaced. */
function* foundationJob(dim, spec, spot, piece, y) {
  for (let i = 0; i < piece.x; i++) {
    for (let j = 0; j < piece.z; j++) {
      const x = spot.x + piece.dx + i;
      const z = spot.z + piece.dz + j;
      if (dim.getBlock({ x, y, z })?.isAir !== false) continue;
      for (let below = y - 1; below >= y - FOUNDATION_DEPTH; below--) {
        const block = dim.getBlock({ x, y: below, z });
        if (!block || !(block.isAir || block.isLiquid || SOFT.test(block.typeId))) break;
        block.setType(spec.foundation);
      }
    }
    yield;
  }
}

let busy = false;

async function placeLandmark(dim, spec, spot, plan) {
  busy = true;
  try {
    if (spot.y === undefined) {
      const y = await chooseLevel(dim, spec, spot);
      if (y === undefined) {
        const rejects = (spot.rejects ?? 0) + 1;
        const next = rejects < MAX_REJECTS ? draw(spec, plan, dim, rejects) : undefined;
        for (const k of Object.keys(spot)) delete spot[k];
        Object.assign(spot, next ?? { none: true }, { rejects });
        console.warn("[Landmarks] " + spec.key + ": spot rejected (" + rejects + ")" + (next ? "; drew " + next.x + ", " + next.z : "; giving up"));
        return;
      }
      spot.y = y;
      spot.done = 0;
      savePlan(plan);
    }
    for (let i = spot.done ?? 0; i < spec.pieces.length; i++) {
      const piece = spec.pieces[i];
      await withPieceArea(dim, spec, spot, piece, spot.y, async () => {
        world.structureManager.place(piece.id, dim, pieceFrom(spot, piece, spot.y));
      });
      spot.done = i + 1;
      savePlan(plan);
      await waitTicks(10);
    }
    for (const piece of spec.pieces) {
      await withPieceArea(dim, spec, spot, piece, spot.y, () => runJobAsync(foundationJob(dim, spec, spot, piece, spot.y)));
    }
    spot.placed = true;
    delete spot.lastError;
    console.log("[Landmarks] placed " + spec.key + " at " + spot.x + ", " + spot.y + ", " + spot.z);
    spec.onPlaced?.(spot, dim);
  } catch (e) {
    if (e.stage !== "loading") spot.tries = (spot.tries ?? 0) + 1;
    spot.lastError = String(e?.message ?? e).slice(0, 120);
    console.warn("[Landmarks] could not place " + spec.key + " (attempt " + spot.tries + "): " + e);
  } finally {
    try {
      savePlan(plan);
    } catch (e) {
      console.warn("[Landmarks] could not save the plan: " + e);
    }
    busy = false;
  }
}

function scan() {
  if (busy) return;
  const plan = loadPlan();

  // one spot per scan, so the biome searches never pile up in a single tick
  const next = SPECS.find((s) => enabled(s) && !plan.spots[s.key] && (!s.dim || s.dim === "overworld" || ENV[s.dim]));
  if (next) {
    const drawn = draw(next, plan, dimensionOf(next), 0);
    if (drawn) {
      plan.spots[next.key] = drawn;
      savePlan(plan);
    }
    return;
  }

  for (const spec of SPECS) {
    if (!enabled(spec)) continue;
    const spot = plan.spots[spec.key];
    if (!spot || spot.none || spot.placed || (spot.tries ?? 0) >= MAX_TRIES) continue;
    const dim = dimensionOf(spec);
    const near = dim.getPlayers().some((p) => {
      const dx = Math.max(spot.x - p.location.x, 0, p.location.x - (spot.x + spec.size.x));
      const dz = Math.max(spot.z - p.location.z, 0, p.location.z - (spot.z + spec.size.z));
      return Math.hypot(dx, dz) < PLACE_MARGIN;
    });
    if (near) {
      placeLandmark(dim, spec, spot, plan);
      return;
    }
  }
}

function report(player) {
  const plan = loadPlan();
  player.sendMessage("§e[Landmarks] spots:");
  for (const spec of SPECS) {
    const s = plan.spots[spec.key];
    let state;
    if (!enabled(spec)) state = "§7not used in this world";
    else if (!s) state = "§7not planned yet";
    else if (s.none) state = "§cno usable spot found";
    else if (s.placed) state = "§aplaced";
    else if ((s.tries ?? 0) >= MAX_TRIES) state = "§cgave up: " + s.lastError;
    else state = "§6waiting for a player nearby";
    const where = s && !s.none ? " §fX: " + s.x + " Z: " + s.z : "";
    player.sendMessage(" §b" + spec.key + " §7(" + spec.dim + ")" + where + " " + state);
  }
}

/** Operator unlock of a spot that gave up. A new spot is drawn on the next scan if none was found. */
function retry(player, key) {
  if (player && !(player.commandPermissionLevel >= 1)) return;
  const plan = loadPlan();
  const spot = plan.spots[key];
  if (!SPECS.some((s) => s.key === key) || !spot || spot.placed) return player?.sendMessage("§c[Landmarks] nothing to retry: " + key);
  if (spot.none) delete plan.spots[key];
  else spot.tries = 0;
  savePlan(plan);
  player?.sendMessage("§a[Landmarks] " + key + " unlocked.");
}

world.afterEvents.worldLoad.subscribe(() => {
  system.runInterval(() => {
    try {
      scan();
    } catch (e) {
      console.warn("[Landmarks] scan error: " + e);
    }
  }, SCAN_TICKS);

  system.afterEvents.scriptEventReceive.subscribe((ev) => {
    const src = ev.sourceEntity;
    if (!src || src.typeId !== "minecraft:player") return;
    if (ev.id === "dbe:landmarks") report(src);
    else if (ev.id === "dbe:landmarks_retry") retry(src, ev.message.trim());
  });
});
