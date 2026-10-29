import { world, system, BlockVolume } from "@minecraft/server";
import { acquireLoadedArea, releaseLoadedArea } from "./travel_safety.js";

const AIR = "minecraft:air";
const repairs = new Map();
const previews = new Map();
const active = new Set();
const ownership = new Map();
let sequence = 0;

// Inspect each run before an unfiltered fill; non-air blocks and block-entity data are never replaced.
export function fillAirColumn(dimension, x, z, from, to, typeId) {
  const writes = [];
  if (to < from) return writes;
  let start;
  for (let y = from; y <= to + 1; y++) {
    const block = y <= to ? dimension.getBlock({ x, y, z }) : null;
    if (y <= to && !block) throw new Error("Terrain column is unavailable at " + x + "," + y + "," + z);
    if (block?.typeId === AIR) { start ??= y; continue; }
    if (start !== undefined) {
      const result = dimension.fillBlocks(new BlockVolume({ x, y: start, z }, { x, y: y - 1, z }), typeId);
      writes.push({ from: start, to: y - 1, typeId, result });
      start = undefined;
    }
  }
  return writes;
}

export function findUnexpectedBlock(dimension, from, to, allowedTypes) {
  if (to.y < from.y) return;
  if (typeof dimension.getBlocks === "function") {
    let inconsistent = false;
    for (const point of dimension.getBlocks(new BlockVolume(from, to), { excludeTypes: allowedTypes }, false).getBlockLocationIterator()) {
      if (!point || ![point.x, point.y, point.z].every(Number.isInteger) || point.x < from.x || point.x > to.x || point.y < from.y || point.y > to.y || point.z < from.z || point.z > to.z) { inconsistent = true; break; }
      const block = dimension.getBlock(point);
      if (!block) throw new Error("Terrain inspection is unavailable at " + point.x + "," + point.y + "," + point.z);
      if (allowedTypes.includes(block.typeId)) { inconsistent = true; break; }
      return point;
    }
    if (!inconsistent) return;
  }
  for (let x = from.x; x <= to.x; x++) for (let z = from.z; z <= to.z; z++) for (let y = from.y; y <= to.y; y++) {
    const block = dimension.getBlock({ x, y, z });
    if (!block) throw new Error("Terrain inspection is unavailable at " + x + "," + y + "," + z);
    if (!allowedTypes.includes(block.typeId)) return { x, y, z };
  }
}

export function runTerrainJob(generator, { timeoutTicks = 2400, inactivityTicks, activity, label = "Terrain job" } = {}) {
  let resolve, reject;
  const completion = new Promise((yes, no) => { resolve = yes; reject = no; });
  // Native jobs may fail before their caller can attach an await handler.
  completion.catch((error) => console.warn("[Terrain job] " + (error?.stack ?? error)));
  let settled = false, timerId, jobId, lastActivity, lastProgressTick;
  const observeProgress = () => {
    if (inactivityTicks === undefined) return;
    const token = activity();
    if (!Number.isSafeInteger(token) || token < 0 || token < lastActivity) throw new Error(label + ": invalid terrain progress token");
    if (lastActivity === undefined || token > lastActivity) {
      lastActivity = token;
      lastProgressTick = system.currentTick;
    }
  };
  const finish = (error, failed = false) => {
    if (settled) return;
    settled = true;
    if (timerId !== undefined) {
      try { system.clearRun(timerId); } catch (error) { console.warn("[Terrain job] timer cleanup: " + error); }
    }
    if (failed) reject(error); else resolve();
  };
  const runner = (function* () {
    try {
      for (const value of generator) { observeProgress(); yield value; }
      observeProgress();
      finish();
    } catch (error) { finish(error, true); }
  })();
  const stop = (error) => {
    if (settled) return;
    finish(error, true);
    try { if (jobId !== undefined) system.clearJob(jobId); } catch (cleanup) { console.warn("[Terrain job] scheduler cleanup: " + cleanup); }
    try { runner.return(); } catch (cleanup) { console.warn("[Terrain job] generator cleanup: " + cleanup); }
  };
  const checkDeadline = () => {
    if (settled) return;
    try {
      if (inactivityTicks !== undefined) {
        const remaining = inactivityTicks - (system.currentTick - lastProgressTick);
        if (remaining > 0) { timerId = system.runTimeout(checkDeadline, remaining); return; }
        stop(new Error(label + " made no verified progress for " + inactivityTicks + " ticks; incomplete terrain remains resumable"));
      } else stop(new Error(label + " timed out after " + timeoutTicks + " ticks; incomplete terrain remains resumable"));
    } catch (error) { stop(error); }
  };
  try {
    const budget = inactivityTicks ?? timeoutTicks;
    if (!Number.isInteger(budget) || budget < 1) throw new Error("Terrain job timeout must be a positive number of game ticks");
    if (inactivityTicks !== undefined && typeof activity !== "function") throw new Error("Terrain inactivity timeout requires verified progress");
    observeProgress();
    timerId = system.runTimeout(checkDeadline, budget);
    jobId = system.runJob(runner);
  } catch (error) { stop(error); }
  return completion;
}

export function* emptyChunk(dimension, cx, cz, minY, maxY, bounds) {
  if (typeof dimension.getBlocks === "function") {
    const x1 = Math.max(cx * 16, bounds?.x1 ?? -Infinity), x2 = Math.min(cx * 16 + 15, bounds?.x2 ?? Infinity);
    const z1 = Math.max(cz * 16, bounds?.z1 ?? -Infinity), z2 = Math.min(cz * 16 + 15, bounds?.z2 ?? Infinity);
    if (x1 > x2 || z1 > z2) return true;
    for (let y = minY; y <= maxY; y += 128) {
      if (findUnexpectedBlock(dimension, { x: x1, y, z: z1 }, { x: x2, y: Math.min(y + 127, maxY), z: z2 }, [AIR])) return false;
      yield;
    }
    return true;
  }
  for (let dx = 0; dx < 16; dx++) for (let dz = 0; dz < 16; dz++) {
    const x = cx * 16 + dx, z = cz * 16 + dz;
    if (bounds && !contains(bounds, x, z)) continue;
    for (let y = minY; y <= maxY; y++) {
      const block = dimension.getBlock({ x, y, z });
      if (!block) throw new Error("Terrain ownership inspection is unavailable at " + x + "," + y + "," + z);
      if (block.typeId !== AIR) return false;
    }
    yield;
  }
  return true;
}

function columnSnapshot(dimension, x, z, spec) {
  const runs = [];
  let previous, length = 0, foreign = false;
  for (let y = spec.minY; y <= spec.maxY; y++) {
    const block = dimension.getBlock({ x, y, z });
    if (!block) throw new Error("Repair column is unavailable at " + x + "," + y + "," + z);
    const type = block.typeId;
    if (type !== AIR && !spec.natural.has(type)) foreign = true;
    if (type === previous) length++;
    else { if (length) runs.push(previous + ":" + length); previous = type; length = 1; }
  }
  runs.push(previous + ":" + length);
  return { signature: runs.join("|"), foreign };
}

function contains(box, x, z) { return x >= box.x1 && x <= box.x2 && z >= box.z1 && z <= box.z2; }
function box(value) {
  if (!value || ![value.x1, value.z1, value.x2, value.z2].every(Number.isInteger) || value.x1 > value.x2 || value.z1 > value.z2) {
    throw new Error("Use integer x1,z1,x2,z2 with ordered bounds");
  }
  return { x1: value.x1, z1: value.z1, x2: value.x2, z2: value.z2 };
}

function fillReviewedRepair(dimension, x, z, span, spec) {
  if (!spec.replaceable) return fillAirColumn(dimension, x, z, span.from, span.to, span.type);
  let start;
  for (let y = span.from; y <= span.to + 1; y++) {
    const block = y <= span.to ? dimension.getBlock({ x, y, z }) : undefined;
    if (y <= span.to && !block) throw new Error("Reviewed repair column is unavailable at " + x + "," + y + "," + z);
    if (block && (block.typeId === AIR || spec.replaceable(block.typeId, span.type) === true)) { start ??= y; continue; }
    if (start !== undefined) {
      dimension.fillBlocks(new BlockVolume({ x, y: start, z }, { x, y: y - 1, z }), span.type);
      start = undefined;
    }
  }
}

function verifyReviewedRepair(block, type) {
  const liquid = ["minecraft:water", "minecraft:flowing_water", "minecraft:lava", "minecraft:flowing_lava"].includes(type);
  return block?.typeId === type && (liquid ? block.isLiquid : block.isSolid && !block.isLiquid);
}

async function loadedColumnJob(spec, bounds, work) {
  const dimension = world.getDimension(spec.dimensionId);
  for (let cx = Math.floor(bounds.x1 / 16); cx <= Math.floor(bounds.x2 / 16); cx++) {
    for (let cz = Math.floor(bounds.z1 / 16); cz <= Math.floor(bounds.z2 / 16); cz++) {
      const area = await acquireLoadedArea(dimension, { x: cx * 16, y: spec.minY, z: cz * 16 }, { x: cx * 16 + 15, y: spec.minY, z: cz * 16 + 15 }, "terrain repair");
      try {
        await runTerrainJob((function* () {
          for (let x = Math.max(cx * 16, bounds.x1); x <= Math.min(cx * 16 + 15, bounds.x2); x++) {
            for (let z = Math.max(cz * 16, bounds.z1); z <= Math.min(cz * 16 + 15, bounds.z2); z++) { work(dimension, x, z); yield; }
          }
        })());
      } finally { releaseLoadedArea(area); }
    }
  }
}

async function handleRepair(player, spec, message) {
  if (player.commandPermissionLevel < 1 || !Number.isInteger(player.commandPermissionLevel)) throw new Error("Terrain repair requires an operator");
  if (active.has(spec.dimensionId)) throw new Error("Another terrain repair is running in this dimension");
  active.add(spec.dimensionId);
  let unlock;
  try {
    unlock = await spec.lock();
    if (message.startsWith("apply ")) {
      const preview = previews.get(player.id);
      if (!preview || preview.spec !== spec || preview.token !== message.slice(6).trim()) throw new Error("No matching preview; run preview again");
      previews.delete(player.id);
      let repaired = 0;
      await loadedColumnJob(spec, preview.bounds, (dimension, x, z) => {
        const saved = preview.columns.get(x + "," + z);
        if (!saved) return;
        const current = columnSnapshot(dimension, x, z, spec);
        if (current.signature !== saved.signature || current.foreign) throw new Error("Terrain changed since preview at " + x + "," + z + "; stopped safely. Preview again");
        for (const span of spec.column(x, z)) fillReviewedRepair(dimension, x, z, span, spec);
        for (const span of spec.column(x, z)) {
          for (let y = span.from; y <= span.to; y++) {
            const block = dimension.getBlock({ x, y, z });
            if (!block || block.typeId === AIR || (spec.replaceable && !verifyReviewedRepair(block, span.type)))
              throw new Error("Repair verification failed at " + x + "," + y + "," + z + "; expected " + span.type + ", observed " + (block?.typeId ?? "unavailable"));
          }
        }
        repaired++;
      });
      player.sendMessage("§aTerrain repair completed: " + repaired + " columns. Excluded/protected columns were unchanged.");
      return;
    }
    if (!message.startsWith("preview ")) throw new Error('Use preview {"x1":0,"z1":0,"x2":15,"z2":15,"exclude":[{"x1":2,"z1":2,"x2":5,"z2":5}]} or apply <token>');
    const request = JSON.parse(message.slice(8)), bounds = box(request);
    if (bounds.x2 - bounds.x1 >= 64 || bounds.z2 - bounds.z1 >= 64) throw new Error("Preview is limited to 64 by 64 columns; divide larger repairs into reviewed tiles");
    if (spec.bounds && (!contains(spec.bounds, bounds.x1, bounds.z1) || !contains(spec.bounds, bounds.x2, bounds.z2))) throw new Error("Repair bounds are outside the configured region");
    const excluded = (request.exclude ?? []).map(box), columns = new Map();
    let protectedColumns = 0, missingBlocks = 0, replacementBlocks = 0;
    await loadedColumnJob(spec, bounds, (dimension, x, z) => {
      if (excluded.some((area) => contains(area, x, z))) { protectedColumns++; return; }
      const snapshot = columnSnapshot(dimension, x, z, spec);
      if (snapshot.foreign) { protectedColumns++; return; }
      let missing = 0, replacements = 0;
      for (const span of spec.column(x, z)) for (let y = span.from; y <= span.to; y++) {
        const block = dimension.getBlock({ x, y, z });
        if (!block) throw new Error("Repair preview is unavailable at " + x + "," + y + "," + z);
        if (block.typeId === AIR) missing++;
        else if (spec.replaceable?.(block.typeId, span.type) === true) replacements++;
      }
      if (missing || replacements) { columns.set(x + "," + z, snapshot); missingBlocks += missing; replacementBlocks += replacements; }
    });
    const token = (++sequence).toString(36) + "-" + system.currentTick;
    previews.set(player.id, { spec, token, bounds, columns });
    player.sendMessage("§eRepair PREVIEW ONLY: " + columns.size + " columns / " + missingBlocks + " missing blocks; " +
      (spec.replaceable ? replacementBlocks + " reviewed liquid replacements; " : "") + protectedColumns + " excluded or foreign-block columns. No blocks changed.");
    if (replacementBlocks) player.sendMessage("§cLiquid origin cannot be inferred. Review every proposed replacement on a COPY and exclude player-placed liquids and all build footprints before applying.");
    player.sendMessage("§cNatural-block builds and excavated air cannot be identified automatically. Use a COPY of the world and exclude every build/excavation footprint before applying. Review bounds X " + bounds.x1 + ".." + bounds.x2 + ", Z " + bounds.z1 + ".." + bounds.z2 + ".");
    player.sendMessage("§eAfter reviewing, /scriptevent " + spec.eventId + " apply " + token);
  } finally { if (unlock) unlock(); active.delete(spec.dimensionId); }
}

export function registerTerrainRepair(spec, aliases = []) {
  if (spec.replaceable !== undefined && typeof spec.replaceable !== "function") throw new Error("Repair replacement policy must be a function");
  for (const id of [spec.eventId, ...aliases]) repairs.set(id, spec);
}

export function registerTerrainOwnership(dimensionId, propertyKey) { ownership.set(dimensionId, propertyKey); }
function protectPlayerEdit({ block, player }) {
  if (!block) return;
  const dimension = block.dimension ?? player?.dimension;
  const propertyKey = ownership.get(dimension?.id);
  if (!propertyKey) return;
  const name = propertyKey(Math.floor(block.location.x / 16), Math.floor(block.location.z / 16));
  if (["inspecting", "building", "complete"].includes(world.getDynamicProperty(name))) world.setDynamicProperty(name, "protected");
}
world.afterEvents.playerPlaceBlock?.subscribe(protectPlayerEdit);
world.afterEvents.playerBreakBlock?.subscribe(protectPlayerEdit);

system.afterEvents.scriptEventReceive.subscribe(({ id, message, sourceEntity }) => {
  const spec = repairs.get(id);
  if (!spec || sourceEntity?.typeId !== "minecraft:player") return;
  handleRepair(sourceEntity, spec, message).catch((error) => {
    console.warn("[Terrain repair] " + id + ": " + error);
    try { sourceEntity.sendMessage("§cTerrain repair stopped: " + error.message); } catch {}
  });
});
