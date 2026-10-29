import { world, system, BlockVolume } from "@minecraft/server";
import { acquireLoadedArea, releaseLoadedArea, registerTravelPreparation } from "./travel_safety.js";
import { fillAirColumn, runTerrainJob, emptyChunk, findUnexpectedBlock, registerTerrainRepair, registerTerrainOwnership } from "./terrain_repair.js";

const DIMENSION = "dbe:future_trunks";
const BOUNDS = { x1: -256, z1: -256, x2: 256, z2: 256 };
const MIN_Y = -64;
const MAX_Y = 319;
const AIR = "minecraft:air";
const STONE = "minecraft:stone";
const SURFACE = "dbe:dirtstone";
const natural = new Set([AIR, STONE, SURFACE, "dbe:dirtstone_grass", "minecraft:bedrock"]);
// Explicit jigsaw distance 80 + maximum reachable NBT piece width/depth 30, aligned to full chunks.
export const FUTURE_CITY_PLAN = { x1: -144, z1: -144, x2: 79, z2: 95 };
let noise, initialized = false, busy = false, repairing = false, cityPreparing = false, cityPromise;
let cityProgress, cityPlacement, cityDeferred, cityActivity, busyActivity;
const retries = new Map();
const wait = (ticks = 1) => new Promise((resolve) => system.runTimeout(resolve, ticks));
const key = (cx, cz) => "dbe:future_terrain_v2:" + cx + "," + cz;
const inBounds = (x, z) => x >= BOUNDS.x1 && x <= BOUNDS.x2 && z >= BOUNDS.z1 && z <= BOUNDS.z2;

class FutureCityPreservationError extends Error {
  constructor(message) { super(message); this.name = "FutureCityPreservationError"; }
}
function reportCityDeferral(entity) {
  try { entity?.sendMessage({ translate: "dbe.future.deferred" }); } catch {}
}
function recordWork(activity, operation, coordinates, completeChunk = false) {
  if (!activity) return;
  activity.serial++;
  activity.lastTick = system.currentTick;
  activity.operation = operation;
  activity.coordinates = coordinates;
  activity.pendingOperation = undefined;
  activity.pendingCoordinates = undefined;
  if (completeChunk) activity.lastChunk = coordinates.cx + "," + coordinates.cz;
}
function pendingWork(activity, operation, coordinates) {
  if (!activity) return;
  activity.pendingOperation = operation;
  activity.pendingCoordinates = coordinates;
}
function activityDetails(activity) {
  return "verified=" + activity.serial + ", lastChunk=" + activity.lastChunk + ", operation=" + activity.operation + ", coordinates=" + JSON.stringify(activity.coordinates) + ", lastTick=" + activity.lastTick + ", pending=" + activity.pendingOperation + ", pendingCoordinates=" + JSON.stringify(activity.pendingCoordinates);
}
function reportCityFailure(error) {
  try { if (error && typeof error === "object" && !(error instanceof FutureCityPreservationError)) error.playerMessage ??= { translate: "dbe.future.failed" }; } catch {}
  try { console.warn("[Future city] " + (error?.futureTerrainDetails ? error.futureTerrainDetails + "\n" : "") + (error?.stack ?? error)); } catch {}
}
function rejectedCity(error) {
  const rejected = Promise.reject(error);
  rejected.catch(reportCityFailure);
  return rejected;
}
function checkWritable(cx, cz) {
  if (world.getDynamicProperty(key(cx, cz)) === "protected") throw new Error("Future generation stopped after a player edit; use reviewed terrain repair");
}
function waitForCityStep(outcome) {
  return new Promise(resolve => {
    let timer, finished = false;
    const wake = () => {
      if (finished) return;
      finished = true;
      try { if (timer !== undefined) system.clearRun(timer); } catch {}
      outcome.waiters.delete(wake);
      resolve();
    };
    outcome.waiters.add(wake);
    try { timer = system.runTimeout(wake, 20); }
    catch (error) { outcome.waiters.delete(wake); throw error; }
    if (outcome.settled) wake();
  });
}

function topAt(x, z) { return Math.floor(noise(x / 35, 0, z / 35) * 4) + 65; }
function column(x, z) {
  const top = topAt(x, z);
  return [{ from: MIN_Y, to: top - 3, type: STONE }, { from: top - 2, to: top, type: SURFACE }];
}

async function lockRepair() {
  if (cityPreparing) throw new Error("Future city preparation is active; retry repair later");
  if (repairing) throw new Error("Future terrain repair is already running");
  const deadline = system.currentTick + 600;
  repairing = true;
  try {
    while (busy) { if (system.currentTick >= deadline) throw new Error("Future generation is busy; retry repair later"); await wait(); }
    return () => { repairing = false; };
  } catch (error) { repairing = false; throw error; }
}

function* terrainJob(dimension, cx, cz, activity) {
  for (let dx = 0; dx < 16; dx++) {
    for (let dz = 0; dz < 16; dz++) {
      checkWritable(cx, cz);
      const x = cx * 16 + dx, z = cz * 16 + dz;
      if (!inBounds(x, z)) continue;
      const top = topAt(x, z);
      // City pieces contain usable interiors above their foundations; never fill those interiors.
      let lowestExisting = top + 1, foreign = false;
      if (typeof dimension.getBlocks === "function") {
        const from = { x, y: MIN_Y, z }, to = { x, y: MAX_Y, z };
        pendingWork(activity, "column_inspection", { cx, cz, x, from: MIN_Y, to: MAX_Y, z });
        foreign = !!findUnexpectedBlock(dimension, from, to, [...natural]);
        if (foreign) for (const point of dimension.getBlocks(new BlockVolume(from, to), { excludeTypes: [AIR] }, false).getBlockLocationIterator()) lowestExisting = Math.min(lowestExisting, point.y);
        recordWork(activity, "column_inspected", { cx, cz, x, y: MAX_Y, z });
      } else {
        for (let y = MIN_Y; y <= MAX_Y; y++) {
          if ((y - MIN_Y) % 64 === 0) { checkWritable(cx, cz); pendingWork(activity, "column_inspection", { cx, cz, x, from: y, to: Math.min(y + 63, MAX_Y), z }); }
          const block = dimension.getBlock({ x, y, z });
          if (!block) throw new Error("Future terrain chunk unloaded at " + x + "," + y + "," + z);
          if (block.typeId !== AIR) {
            lowestExisting = Math.min(lowestExisting, y);
            if (!natural.has(block.typeId)) foreign = true;
          }
          if ((y - MIN_Y + 1) % 64 === 0 || y === MAX_Y) {
            recordWork(activity, "column_inspected", { cx, cz, x, y, z });
            yield;
          }
        }
      }
      const limit = foreign ? Math.min(top, lowestExisting - 1) : top;
      const writes = [];
      for (const span of column(x, z)) for (let from = span.from; from <= Math.min(span.to, limit); from += 64) {
        checkWritable(cx, cz);
        const to = Math.min(from + 63, span.to, limit);
        pendingWork(activity, "air_span_inspection_and_fill", { cx, cz, x, from, to, z, type: span.type });
        writes.push(...fillAirColumn(dimension, x, z, from, to, span.type));
        recordWork(activity, "air_span_inspected_and_filled", { cx, cz, x, y: to, z });
        yield;
      }
      // Every new natural column must have a continuous solid core, not just a completion property.
      for (let y = MIN_Y; y <= limit; y++) {
        if ((y - MIN_Y) % 64 === 0) { checkWritable(cx, cz); pendingWork(activity, "solid_core_verification", { cx, cz, x, from: y, to: Math.min(y + 63, limit), z }); }
        const block = dimension.getBlock({ x, y, z });
        if (!block || !block.isSolid || block.isLiquid) {
          const write = writes.find((span) => y >= span.from && y <= span.to);
          let placed = "unavailable";
          if (write?.result?.getBlockLocationIterator) {
            try { placed = 0; for (const _ of write.result.getBlockLocationIterator()) placed++; }
            catch (error) { placed = "inspection failed: " + error; }
          }
          const expected = y > top - 3 ? SURFACE : STONE;
          const height = dimension.heightRange;
          throw new Error("Future terrain verification failed at " + x + "," + y + "," + z + " in " + dimension.id + " chunk " + cx + "," + cz + "; expected solid " + expected + " profile, observed " + (block?.typeId ?? "unavailable") + " (solid=" + block?.isSolid + ", liquid=" + block?.isLiquid + "); core=" + MIN_Y + ".." + limit + "; fill=" + (write ? write.typeId + " " + write.from + ".." + write.to + ", requested=" + (write.to - write.from + 1) + ", reported=" + placed : "no air-run write at this block") + "; heightRange=" + (height ? height.min + ".." + height.max : "unavailable"));
        }
        if ((y - MIN_Y + 1) % 64 === 0 || y === limit) {
          recordWork(activity, "solid_core_verified", { cx, cz, x, y, z });
          yield;
        }
      }
      yield;
    }
  }
  if (world.getDynamicProperty(key(cx, cz)) === "protected") throw new Error("Future generation stopped after a player edit");
  world.setDynamicProperty(key(cx, cz), "complete");
  recordWork(activity, "chunk_generated_and_verified", { cx, cz }, true);
}

async function ensureChunk(dimension, cx, cz, entity, waitForPreparation = false) {
  if (cityPreparing) {
    if (!waitForPreparation) throw new Error("Future city preparation is active; retry travel later");
    await waitForCity(entity);
  }
  if (repairing) throw new Error("Future terrain repair is active; retry travel when it finishes");
  const deadline = system.currentTick + 600;
  while (busy) { if (system.currentTick >= deadline) throw new Error("Future terrain queue timed out"); await wait(); }
  if (repairing) throw new Error("Future terrain repair is active; retry travel when it finishes");
  if (cityPreparing) {
    if (!waitForPreparation) throw new Error("Future city preparation is active; retry travel later");
    await waitForCity(entity);
    return ensureChunk(dimension, cx, cz, entity, waitForPreparation);
  }
  busy = true;
  try {
    const state = world.getDynamicProperty(key(cx, cz));
    if (["complete", "legacy", "protected"].includes(state)) return;
    // Legacy completed chunks may contain player excavations. Only an explicit reviewed repair may fill them.
    if (state !== "building" && world.getDynamicProperty("generated:" + DIMENSION + "|" + cx + "|" + cz)) return;
    const from = { x: cx * 16, y: MIN_Y, z: cz * 16 }, to = { x: from.x + 15, y: MIN_Y, z: from.z + 15 };
    const area = await acquireLoadedArea(dimension, from, to, "Future terrain generation");
    const activity = { serial: 0, lastTick: system.currentTick, lastChunk: "—", operation: "starting", coordinates: { cx, cz } };
    busyActivity = activity;
    recordWork(activity, "loaded_chunk_verified", { cx, cz });
    try {
      await runTerrainJob((function* () {
        if (state !== "building") {
          world.setDynamicProperty(key(cx, cz), "inspecting");
          pendingWork(activity, "empty_chunk_inspection", { cx, cz });
          if (!(yield* emptyChunk(dimension, cx, cz, MIN_Y, MAX_Y, BOUNDS))) {
            if (world.getDynamicProperty(key(cx, cz)) !== "protected") world.setDynamicProperty(key(cx, cz), "legacy");
            console.warn("[Future terrain] Unowned nonempty chunk " + cx + "," + cz + " preserved; use a reviewed dbe:future_repair preview on a world copy");
            return;
          }
          recordWork(activity, "empty_chunk_verified", { cx, cz }, true);
          if (world.getDynamicProperty(key(cx, cz)) === "protected") throw new Error("Future ownership inspection interrupted by a player edit");
          world.setDynamicProperty(key(cx, cz), "building");
        }
      yield* terrainJob(dimension, cx, cz, activity);
      })(), { inactivityTicks: 2400, activity: () => activity.serial, label: "Future chunk " + cx + "," + cz });
    } finally { releaseLoadedArea(area); }
    retries.delete(cx + "," + cz);
  } catch (error) {
    const name = cx + "," + cz, attempts = Math.min((retries.get(name)?.attempts ?? 0) + 1, 5);
    retries.set(name, { attempts, after: system.currentTick + Math.min(100 * 2 ** (attempts - 1), 1200) });
    throw error;
  } finally { busy = false; busyActivity = undefined; }
}

function safeStanding(dimension, x, y, z) {
  const floor = dimension.getBlock({ x, y: y - 1, z }), feet = dimension.getBlock({ x, y, z }), head = dimension.getBlock({ x, y: y + 1, z });
  return floor?.isSolid && !floor.isLiquid && feet && head && !feet.isSolid && !feet.isLiquid && !head.isSolid && !head.isLiquid;
}

async function waitForCity(entity) {
  const shared = cityPromise;
  if (!shared) return;
  const activity = cityActivity, startedAt = system.currentTick;
  const outcome = activity.outcome;
  const origin = entity ? { dimension: entity.dimension.id, ...entity.location } : undefined;
  const checkOrigin = () => {
    if (entity && (!entity.isValid || entity.dimension.id !== origin.dimension || Math.hypot(entity.location.x - origin.x, entity.location.y - origin.y, entity.location.z - origin.z) > 16)) {
      const error = new Error("Future travel interrupted while waiting; the shared city preparation continues");
      error.playerMessage = { translate: "dbe.future.wait_cancelled" };
      throw error;
    }
  };
  let noticeAt = system.currentTick;
  while (!outcome.settled) {
    checkOrigin();
    const idleTicks = system.currentTick - Math.max(startedAt, activity.lastTick);
    if (idleTicks >= 1200) {
      const elapsed = system.currentTick - startedAt;
      const error = new Error("Future city preparation timed out after " + idleTicks + " ticks without verified progress (" + elapsed + " total ticks); you remain at the origin. Preparation continues; retry to wait for the same job; " + activityDetails(activity));
      error.playerMessage = { translate: "dbe.future.wait_inactive", with: [String(idleTicks), String(elapsed)] };
      throw error;
    }
    if (entity && cityProgress && system.currentTick >= noticeAt) {
      try { entity.sendMessage({ translate: "dbe.future.progress." + cityProgress.stage, with: [String(cityProgress.done), String(cityProgress.total), activity.lastChunk] }); } catch {}
      noticeAt = system.currentTick + 100;
    }
    await waitForCityStep(outcome);
  }
  checkOrigin();
  if (outcome.failed) {
    if (!(outcome.error instanceof FutureCityPreservationError)) throw outcome.error;
    reportCityDeferral(entity);
  }
}

async function prepareDestination(dimension, location, entity) {
  const x = Math.floor(location.x), z = Math.floor(location.z), cx = Math.floor(x / 16), cz = Math.floor(z / 16);
  if (!inBounds(x, z)) throw new Error("Future destination is outside the configured terrain region (-256..256)");
  if (!cityPromise && !world.getDynamicProperty("futureTrunksCityLoaded") && world.getDynamicProperty("futureTrunksCityStarted")) throw new Error("Future city placement was interrupted; inspect the world copy before any city retry");
  if (!cityPromise && cityDeferred) reportCityDeferral(entity);
  if (!cityPromise && cityPlacement && !cityDeferred && !world.getDynamicProperty("futureTrunksCityLoaded")) {
    const restarted = prepareFutureCity(dimension, cityPlacement);
    restarted.catch(() => {}); // The shared city promise below retains the original failure for this traveler.
    if (!cityPromise) await restarted;
  }
  await waitForCity(entity);
  if (repairing) throw new Error("Future terrain repair is active; retry travel after it finishes");
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const nx = cx + dx, nz = cz + dz;
    if (nx * 16 > BOUNDS.x2 || nx * 16 + 15 < BOUNDS.x1 || nz * 16 > BOUNDS.z2 || nz * 16 + 15 < BOUNDS.z1) continue;
    await ensureChunk(dimension, nx, nz, entity, true);
  }
  if (safeStanding(dimension, x, Math.floor(location.y), z)) return location;
  const start = topAt(x, z) + 1;
  for (let distance = 0; distance <= 32; distance++) {
    for (const y of distance ? [start + distance, start - distance] : [start]) {
      if (y <= MIN_Y || y >= MAX_Y || !safeStanding(dimension, x, y, z)) continue;
      return { x: location.x, y, z: location.z };
    }
  }
  throw new Error("Future arrival has no solid floor and clear headroom. The player was not moved; preview the affected terrain with dbe:future_repair on a world copy");
}

function* verifyCityChunk(dimension, cx, cz, state, activity) {
  if (["legacy", "protected"].includes(state) || (!state && world.getDynamicProperty("generated:" + DIMENSION + "|" + cx + "|" + cz))) {
    throw new FutureCityPreservationError("Future city deferred: legacy or player-protected terrain at " + cx + "," + cz);
  }
  if (typeof dimension.getBlocks === "function" && !["complete", "building"].includes(state)) {
    pendingWork(activity, "empty_chunk_inspection", { cx, cz });
    if (!(yield* emptyChunk(dimension, cx, cz, MIN_Y, MAX_Y))) throw new FutureCityPreservationError("Future city deferred: unowned or changed block in " + cx + "," + cz + "; no city was placed");
    if (world.getDynamicProperty(key(cx, cz)) === "protected") throw new Error("Future city preparation interrupted by a player edit");
    recordWork(activity, "empty_chunk_verified", { cx, cz }, true);
    return;
  }
  for (let dx = 0; dx < 16; dx++) for (let dz = 0; dz < 16; dz++) {
    if (world.getDynamicProperty(key(cx, cz)) === "protected") throw new Error("Future city preparation interrupted by a player edit");
    const x = cx * 16 + dx, z = cz * 16 + dz, top = topAt(x, z);
    if (typeof dimension.getBlocks === "function") {
      for (const span of [...column(x, z), { from: top + 1, to: MAX_Y, type: AIR }]) {
        const allowed = state === "building" ? [AIR, span.type] : [span.type];
        pendingWork(activity, "profile_query", { cx, cz, x, from: span.from, to: span.to, z, expected: span.type });
        const point = findUnexpectedBlock(dimension, { x, y: span.from, z }, { x, y: span.to, z }, allowed);
        if (point) throw new FutureCityPreservationError("Future city deferred: unowned or changed block at " + point.x + "," + point.y + "," + point.z + "; no city was placed");
      }
      recordWork(activity, "profile_column_verified", { cx, cz, x, y: MAX_Y, z });
    } else {
      for (let y = MIN_Y; y <= MAX_Y; y++) {
        if ((y - MIN_Y) % 64 === 0) {
          if (world.getDynamicProperty(key(cx, cz)) === "protected") throw new Error("Future city preparation interrupted by a player edit");
          pendingWork(activity, "profile_span_verification", { cx, cz, x, from: y, to: Math.min(y + 63, MAX_Y), z });
        }
        const block = dimension.getBlock({ x, y, z });
        if (!block) throw new Error("Future city preflight chunk is unavailable");
        const expected = y > top ? AIR : y > top - 3 ? SURFACE : STONE;
        const allowed = state === "complete" ? block.typeId === expected : state === "building" ? block.typeId === AIR || block.typeId === expected : block.typeId === AIR;
        if (!allowed) throw new FutureCityPreservationError("Future city deferred: unowned or changed block at " + x + "," + y + "," + z + "; no city was placed");
        if ((y - MIN_Y + 1) % 64 === 0 || y === MAX_Y) {
          recordWork(activity, "profile_span_verified", { cx, cz, x, y, z });
          yield;
        }
      }
    }
    yield;
  }
  recordWork(activity, "profile_chunk_verified", { cx, cz }, true);
}

export function prepareFutureCity(dimension, placeCity) {
  try { return startCity(dimension, placeCity); }
  catch (error) { return rejectedCity(error); }
}
function startCity(dimension, placeCity) {
  if (!initialized) return rejectedCity(new Error("Future terrain must initialize before city preparation"));
  if (dimension.id !== DIMENSION) return rejectedCity(new Error("Future city has the wrong dimension"));
  if (typeof placeCity !== "function") return rejectedCity(new Error("Future city placement callback is unavailable"));
  cityPlacement ??= placeCity;
  if (cityPromise) return cityPromise;
  if (world.getDynamicProperty("futureTrunksCityLoaded")) { cityDeferred = undefined; return Promise.resolve(); }
  if (world.getDynamicProperty("futureTrunksCityStarted")) return rejectedCity(new Error("Future city placement was interrupted; inspect the world copy before any city retry"));
  if (repairing) return rejectedCity(new Error("Future terrain repair is active; retry city preparation later"));
  cityDeferred = undefined;
  cityPreparing = true;
  cityProgress = { stage: "loading", done: 0, total: 0 };
  const activity = cityActivity = { serial: 0, lastTick: system.currentTick, lastChunk: "—", operation: "starting", coordinates: {} };
  const outcome = activity.outcome = { settled: false, failed: false, error: undefined, waiters: new Set() };
  const job = (generator, label) => runTerrainJob(generator, { inactivityTicks: 2400, activity: () => activity.serial, label });
  cityPromise = (async () => {
    let area, ownsBusy = false;
    try {
      pendingWork(activity, "waiting_generation_queue", {});
      let queuedProgressTick = system.currentTick, dependency, dependencySerial = 0;
      while (busy) {
        if (busyActivity !== dependency) { dependency = busyActivity; dependencySerial = 0; }
        if (dependency && dependency.serial > dependencySerial) {
          dependencySerial = dependency.serial;
          queuedProgressTick = system.currentTick;
          recordWork(activity, "queued_dependency_verified", { ...dependency.coordinates, dependencySerial, dependencyOperation: dependency.operation });
        }
        if (system.currentTick - queuedProgressTick >= 600) throw new Error("Future city generation queue timed out after 600 ticks without verified dependency progress");
        pendingWork(activity, "waiting_generation_queue", { dependencySerial });
        await wait();
      }
      if (repairing) throw new Error("Future terrain repair is active; retry city preparation later");
      busy = true;
      busyActivity = activity;
      ownsBusy = true;
      pendingWork(activity, "loading_city_envelope", FUTURE_CITY_PLAN);
      area = await acquireLoadedArea(dimension,
        { x: FUTURE_CITY_PLAN.x1, y: MIN_Y, z: FUTURE_CITY_PLAN.z1 },
        { x: FUTURE_CITY_PLAN.x2, y: MIN_Y, z: FUTURE_CITY_PLAN.z2 }, "Future city full terrain envelope");
      recordWork(activity, "loaded_envelope_verified", { x1: FUTURE_CITY_PLAN.x1, z1: FUTURE_CITY_PLAN.z1, x2: FUTURE_CITY_PLAN.x2, z2: FUTURE_CITY_PLAN.z2 });
      const chunks = [];
      for (let cx = Math.floor(FUTURE_CITY_PLAN.x1 / 16); cx <= Math.floor(FUTURE_CITY_PLAN.x2 / 16); cx++) for (let cz = Math.floor(FUTURE_CITY_PLAN.z1 / 16); cz <= Math.floor(FUTURE_CITY_PLAN.z2 / 16); cz++) chunks.push([cx, cz]);
      // Capacity and every chunk's provenance are checked before the first terrain write.
      await job((function* () {
        cityProgress = { stage: "preflight", done: 0, total: chunks.length };
        for (const [cx, cz] of chunks) { yield* verifyCityChunk(dimension, cx, cz, world.getDynamicProperty(key(cx, cz)), activity); cityProgress.done++; }
      })(), "Future city preflight");
      for (const [cx, cz] of chunks) if (!world.getDynamicProperty(key(cx, cz))) world.setDynamicProperty(key(cx, cz), "inspecting");
      await job((function* () {
        cityProgress = { stage: "generation", done: 0, total: chunks.length };
        for (const [cx, cz] of chunks) {
          const state = world.getDynamicProperty(key(cx, cz));
          yield* verifyCityChunk(dimension, cx, cz, state, activity);
          if (state !== "complete") {
            if (world.getDynamicProperty(key(cx, cz)) === "protected") throw new Error("Future city preparation interrupted by a player edit");
            world.setDynamicProperty(key(cx, cz), "building");
            yield* terrainJob(dimension, cx, cz, activity);
          }
          cityProgress.done++;
        }
        cityProgress = { stage: "verify", done: 0, total: chunks.length };
        for (const [cx, cz] of chunks) { yield* verifyCityChunk(dimension, cx, cz, "complete", activity); cityProgress.done++; }
      })(), "Future city terrain preparation");
      // No await between the last provenance check and the native placement call.
      for (const [cx, cz] of chunks) if (world.getDynamicProperty(key(cx, cz)) !== "complete") throw new Error("Future city terrain changed before placement");
      world.setDynamicProperty("futureTrunksCityStarted", true);
      cityProgress = { stage: "placement", done: chunks.length, total: chunks.length };
      pendingWork(activity, "native_city_placement", FUTURE_CITY_PLAN);
      const placed = await placeCity();
      if (!placed?.min || !placed?.max || ![placed.min.x, placed.min.y, placed.min.z, placed.max.x, placed.max.y, placed.max.z].every(Number.isFinite) || placed.min.x < FUTURE_CITY_PLAN.x1 || placed.min.z < FUTURE_CITY_PLAN.z1 || placed.max.x > FUTURE_CITY_PLAN.x2 || placed.max.z > FUTURE_CITY_PLAN.z2) {
        throw new Error("Future city returned invalid or out-of-envelope bounds; inspect this world copy before retrying");
      }
      world.setDynamicProperty("futureTrunksCityLoaded", true);
    } catch (error) {
      if (error instanceof FutureCityPreservationError) cityDeferred = error;
      try { if (error && typeof error === "object") error.futureTerrainDetails = "phase=" + cityProgress.stage + "; " + activityDetails(activity); } catch {}
      throw error;
    } finally {
      if (area) releaseLoadedArea(area);
      if (ownsBusy) { busy = false; busyActivity = undefined; }
    }
  })().finally(() => { cityPromise = undefined; cityPreparing = false; cityProgress = undefined; cityActivity = undefined; });
  cityPromise.then(() => {
    outcome.settled = true;
    for (const wake of [...outcome.waiters]) wake();
  }, error => {
    outcome.error = error;
    outcome.failed = true;
    outcome.settled = true;
    reportCityFailure(error);
    for (const wake of [...outcome.waiters]) wake();
  });
  return cityPromise;
}

export function initializeFutureTerrain(noiseFunction) {
  if (initialized) return;
  if (typeof noiseFunction !== "function") throw new Error("Future terrain noise function is unavailable");
  noise = noiseFunction;
  initialized = true;
  registerTravelPreparation(DIMENSION, prepareDestination);
  registerTerrainOwnership(DIMENSION, key);
  registerTerrainRepair({ eventId: "dbe:future_repair", dimensionId: DIMENSION, bounds: BOUNDS, minY: MIN_Y, maxY: MAX_Y, natural, column, lock: lockRepair });
  world.afterEvents.worldLoad.subscribe(() => system.runInterval(() => {
    if (busy || repairing || cityPreparing) return;
    try {
      const dimension = world.getDimension(DIMENSION);
      for (const player of dimension.getPlayers()) {
        const cx = Math.floor(player.location.x / 16), cz = Math.floor(player.location.z / 16);
        for (let radius = 0; radius <= 2; radius++) for (let dx = -radius; dx <= radius; dx++) for (let dz = -radius; dz <= radius; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== radius) continue;
          const nx = cx + dx, nz = cz + dz;
          if (nx * 16 > BOUNDS.x2 || nx * 16 + 15 < BOUNDS.x1 || nz * 16 > BOUNDS.z2 || nz * 16 + 15 < BOUNDS.z1) continue;
          if ((retries.get(nx + "," + nz)?.after ?? 0) > system.currentTick) continue;
          if (["complete", "legacy", "protected"].includes(world.getDynamicProperty(key(nx, nz))) || world.getDynamicProperty("generated:" + DIMENSION + "|" + nx + "|" + nz)) continue;
          ensureChunk(dimension, nx, nz).catch((error) => console.warn("[Future terrain] " + (error?.stack ?? error)));
          return;
        }
      }
    } catch (error) { console.warn("[Future terrain] scan failed: " + (error?.stack ?? error)); }
  }, 20));
}

export const __futureTerrain = { topAt, column, terrainJob, ensureChunk, prepareDestination, safeStanding, inBounds };
