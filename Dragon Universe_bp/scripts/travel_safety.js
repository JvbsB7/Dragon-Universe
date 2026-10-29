import { world, system } from "@minecraft/server";

const pending = new Set();
const preparations = new Map();
const loadedAreas = new Map();
const reportedFailures = new Map();
let creatingAreas = 0;
let serial = 0;
const wait = (ticks) => new Promise((resolve) => system.runTimeout(resolve, ticks));
const unavailable = (error) => /unloaded|not.*loaded|not.*ticking|LocationInUnloadedChunk/i.test(String(error));

export const isTravelPending = (entity) => pending.has(entity.id);
export const travelOrigin = (entity) => ({ dimension: entity.dimension.id, ...entity.location });
export const physicalDestinationId = (id) => id === "dbe:kaioshin" ? "dbe:kai" : id;

export class TravelError extends Error {
  constructor(stage, message, cause) {
    super(message, { cause });
    this.name = "TravelError";
    this.stage = stage;
  }
}

export const registerTravelPreparation = (dimensionId, prepare) => preparations.set(dimensionId, prepare);
export function travelFailureMessage(error) {
  return (error?.stage ?? "travel") + ": " + (error?.message ?? String(error));
}

export function reportTravelFailure(entity, label, error, destinationId, failureStage = "travel") {
  const destination = physicalDestinationId(error?.destinationId ?? destinationId ?? "unknown");
  const stage = error?.stage ?? failureStage;
  const category = stage === "lookup" ? "lookup" : !error?.afterTeleport && ["origin", "destination", "dispatch", "loading", "generation", "arrival", "transaction"].includes(stage) ? "preparation" : "teleport";
  const message = travelFailureMessage(error), key = label + ": " + destination + ": " + message;
  const previous = reportedFailures.get(entity.id);
  if (previous?.key === key && system.currentTick - previous.tick < 100) return;
  reportedFailures.set(entity.id, { key, tick: system.currentTick });
  if (reportedFailures.size > 128) reportedFailures.delete(reportedFailures.keys().next().value);
  const diagnostics = [];
  const beforeArrival = ["destination", "loading", "generation"].includes(error?.stage);
  let feedback = error?.destinationId === "dbe:future_trunks" ? { translate: beforeArrival ? "dbe.future.failed" : "dbe.future.travel_failed" } : undefined;
  for (let cause = error, depth = 0; cause && depth < 8; cause = cause.cause, depth++) {
    diagnostics.push(cause.stack ?? String(cause));
    if (cause.playerMessage?.translate?.startsWith("dbe.future.") && (!feedback || ["dbe.future.failed", "dbe.future.travel_failed"].includes(feedback.translate))) feedback = cause.playerMessage;
  }
  console.warn(`[Dragon Universe] Travel ${label} failed [destination=${destination}; stage=${stage}]: ${diagnostics.length ? diagnostics.join("\nCaused by: ") : String(error)}`);
  try {
    if (entity.isValid && entity.typeId === "minecraft:player")
      entity.sendMessage(feedback ?? { translate: "dbe.travel.failed." + category, with: [destination] });
  } catch (feedbackError) { console.warn("[Travel] feedback unavailable: " + feedbackError); }
}

export function releaseLoadedArea(id) {
  if (!id) return;
  const held = loadedAreas.get(id);
  if (held && --held.references > 0) return;
  loadedAreas.delete(id);
  try {
    world.tickingAreaManager.removeTickingArea(id);
  } catch (error) {
    console.warn("[Travel] temporary area cleanup " + id + ": " + error);
  }
}

// Probe every chunk, not just the corners: a rectangular area may have unloaded interior chunks.
export function areaReady(dimension, from, to) {
  for (let cx = Math.floor(Math.min(from.x, to.x) / 16); cx <= Math.floor(Math.max(from.x, to.x) / 16); cx++) {
    for (let cz = Math.floor(Math.min(from.z, to.z) / 16); cz <= Math.floor(Math.max(from.z, to.z) / 16); cz++) {
      const point = { x: cx * 16, y: Math.floor(from.y), z: cz * 16 };
      try {
        if (typeof dimension.isChunkLoaded === "function" && !dimension.isChunkLoaded(point)) return false;
        if (!dimension.getBlock(point)) return false;
      } catch (error) {
        if (unavailable(error)) return false;
        throw error;
      }
    }
  }
  return true;
}

export async function acquireLoadedArea(dimension, from, to, label = "travel") {
  const minX = Math.floor(Math.min(from.x, to.x) / 16), maxX = Math.floor(Math.max(from.x, to.x) / 16);
  const minZ = Math.floor(Math.min(from.z, to.z) / 16), maxZ = Math.floor(Math.max(from.z, to.z) / 16);
  for (const [heldId, held] of loadedAreas) {
    if (held.dimensionId === dimension.id && minX >= held.minX && maxX <= held.maxX &&
        minZ >= held.minZ && maxZ <= held.maxZ && areaReady(dimension, from, to)) {
      held.references++;
      return heldId;
    }
  }
  const id = "dbe:transit_" + system.currentTick + "_" + serial++;
  let expired = false;
  let created = false;
  let timer;
  let creating = false;
  try {
    const manager = world.tickingAreaManager;
    if (!manager) throw new Error("TickingAreaManager is unavailable in this API build");
    const options = { dimension, from, to };
    const requested = (maxX - minX + 1) * (maxZ - minZ + 1);
    for (let attempt = 0; typeof manager.hasCapacity === "function" && !manager.hasCapacity(options); attempt++) {
      if (requested > manager.maxChunkCount || (!loadedAreas.size && !creatingAreas) || attempt >= 60)
        throw new Error("Ticking area capacity exceeded (" + manager.chunkCount + "/" + manager.maxChunkCount +
          " chunks; requested " + requested + ")");
      await wait(5);
    }
    creatingAreas++;
    creating = true;
    const creation = manager.createTickingArea(id, options);
    const deadline = new Promise((_, reject) => {
      timer = system.runTimeout(() => { expired = true; reject(new Error(label + ": chunk loading timed out")); }, 300);
    });
    await Promise.race([
      Promise.resolve(creation).then(() => {
        created = true;
        if (expired) releaseLoadedArea(id);
      }),
      deadline,
    ]);
    system.clearRun(timer);
    for (let attempt = 0; attempt < 60; attempt++) {
      if (areaReady(dimension, from, to)) {
        loadedAreas.set(id, { dimensionId: dimension.id, minX, maxX, minZ, maxZ, references: 1 });
        return id;
      }
      await wait(5);
    }
    throw new Error(label + ": destination chunks are unavailable");
  } catch (error) {
    if (created && !expired) releaseLoadedArea(id);
    const failure = new TravelError("loading", label + ": " + (error?.message ?? String(error)), error);
    failure.destinationId = dimension.id;
    throw failure;
  } finally {
    if (creating) creatingAreas--;
    if (timer !== undefined) system.clearRun(timer);
  }
}

// Keep the source untouched until the destination is readable. Teleport failures preserve the origin.
// A pending destination is temporary; no permanent ticking area is added to the world.
export async function safeTeleport(entity, location, options = {}) {
  const entityId = entity.id;
  try {
    if (pending.has(entityId)) throw new TravelError("interrupted", "Travel is already pending for " + entityId);
    if (![location?.x, location?.y, location?.z].every(Number.isFinite)) throw new TravelError("destination", "Invalid travel coordinates");
  } catch (error) {
    if (options.dimension?.id) error.destinationId = options.dimension.id;
    if (options.dimension?.id === "dbe:future_trunks") {
      error.destinationId = options.dimension.id;
      if (error.stage === "interrupted") error.playerMessage = { translate: "dbe.future.already_waiting" };
    }
    throw error;
  }
  pending.add(entityId);
  try {
    return await teleportWithLease(entity, location, options);
  } finally {
    pending.delete(entityId);
  }
}

const earthHazards = new Set(["minecraft:lava", "minecraft:flowing_lava", "minecraft:fire", "minecraft:soul_fire",
  "minecraft:magma", "minecraft:cactus", "minecraft:campfire", "minecraft:soul_campfire", "minecraft:powder_snow",
  "minecraft:sweet_berry_bush", "minecraft:wither_rose", "minecraft:pointed_dripstone", "minecraft:web"]);

export function isSafeStanding(dimension, location) {
  const point = { x: Math.floor(location.x), y: Math.floor(location.y), z: Math.floor(location.z) };
  const headY = Math.floor(location.y + 1.8 - 0.0001);
  const range = dimension.heightRange;
  if (range && (point.y - 1 < range.min || headY >= range.max)) return false;
  for (const x of new Set([Math.floor(location.x - 0.2999), Math.floor(location.x + 0.2999)])) {
    for (const z of new Set([Math.floor(location.z - 0.2999), Math.floor(location.z + 0.2999)])) {
      const floor = dimension.getBlock({ x, y: point.y - 1, z });
      if (!floor?.isSolid || floor.isLiquid || earthHazards.has(floor.typeId)) return false;
      for (let y = point.y; y <= headY; y++) {
        const block = dimension.getBlock({ x, y, z });
        if (!block || block.isSolid || block.isLiquid || earthHazards.has(block.typeId)) return false;
      }
    }
  }
  return true;
}

// Resolve existing supported terrain only; returning home never excavates blocks or creates a platform.
export async function safeReturnToEarth(entity, options = {}) {
  const entityId = entity.id;
  if (pending.has(entityId)) throw new TravelError("interrupted", "Travel is already pending for " + entityId);
  pending.add(entityId);
  const finite = point => point && [point.x, point.y, point.z].every(Number.isFinite);
  const earth = point => (point?.d ?? point?.dimension?.id ?? point?.dimension) === "minecraft:overworld";
  let stage = "origin", lastFailure;
  try {
    const { savedOrigin, onPrepared, label = "return to Earth", ...teleportOptions } = options;
    const origin = options.origin ?? travelOrigin(entity);
    stage = "lookup";
    const dimension = world.getDimension("minecraft:overworld"), candidates = [], failures = [];
    stage = "arrival";
    if (finite(savedOrigin) && earth(savedOrigin)) candidates.push({ point: savedOrigin, name: "saved origin" });
    try {
      const spawn = entity.getSpawnPoint?.();
      if (finite(spawn) && earth(spawn)) candidates.push({ point: spawn, name: "personal spawn" });
    } catch (error) { failures.push("personal spawn: " + (error.message ?? error)); }
    try {
      const spawn = world.getDefaultSpawnLocation();
      if (finite(spawn)) candidates.push({ point: spawn, name: "world spawn" });
    } catch (error) { failures.push("world spawn: " + (error.message ?? error)); }
    for (const candidate of candidates) {
      let area;
      try {
        const center = { x: Math.floor(candidate.point.x), y: Math.floor(candidate.point.y), z: Math.floor(candidate.point.z) };
        const probeY = Math.max(dimension.heightRange?.min ?? -64, Math.min(center.y, (dimension.heightRange?.max ?? 320) - 2));
        area = await acquireLoadedArea(dimension, { x: center.x - 8, y: probeY, z: center.z - 8 },
          { x: center.x + 8, y: probeY, z: center.z + 8 }, label + " " + candidate.name);
        let target;
        for (let radius = 0; radius <= 8 && !target; radius++) {
          for (let dx = -radius; dx <= radius && !target; dx++) for (let dz = -radius; dz <= radius && !target; dz++) {
            if (Math.max(Math.abs(dx), Math.abs(dz)) !== radius) continue;
            const x = center.x + dx, z = center.z + dz;
            const exact = { x: radius ? x + 0.5 : candidate.point.x, y: candidate.point.y, z: radius ? z + 0.5 : candidate.point.z };
            if (isSafeStanding(dimension, exact)) { target = exact; break; }
            const highest = dimension.getTopmostBlock({ x, z });
            const top = highest?.location ?? highest;
            if (!top || !Number.isFinite(top.y)) continue;
            const surface = { x: x + 0.5, y: top.y + 1, z: z + 0.5 };
            if (isSafeStanding(dimension, surface)) target = surface;
          }
        }
        if (!target) throw new TravelError("arrival", "No supported, clear and non-hazardous ground near " + candidate.name);
        if (onPrepared) {
          try { await onPrepared({ dimension: dimension.id, ...target }); }
          catch (error) { throw new TravelError("transaction", "Could not persist the return intent: " + (error.message ?? error), error); }
        }
        const saved = candidate.point;
        await teleportWithLease(entity, target, { ...teleportOptions, dimension, origin, requireGround: true, label,
          rotation: options.rotation ?? (Number.isFinite(saved.rx) && Number.isFinite(saved.ry) ? { x: saved.rx, y: saved.ry } : undefined) });
        return target;
      } catch (error) {
        if (error.afterTeleport || ["interrupted", "transaction", "teleport"].includes(error.stage)) throw error;
        lastFailure = error;
        failures.push(candidate.name + ": " + travelFailureMessage(error));
      } finally { if (area) releaseLoadedArea(area); }
    }
    throw new TravelError("arrival", label + " failed; " + failures.join("; "), lastFailure);
  } catch (error) {
    const failure = error instanceof TravelError ? error : new TravelError(stage, error?.message ?? String(error), error);
    failure.destinationId ??= "minecraft:overworld";
    throw failure;
  } finally { pending.delete(entityId); }
}

async function teleportWithLease(entity, location, options) {
  let id, destinationId, afterTeleport = false;
  try {
    const { label = "travel", origin = travelOrigin(entity), requireGround: requestedGround = false, ...teleportOptions } = options;
    const dimension = teleportOptions.dimension ?? entity.dimension;
    destinationId = dimension.id;
    let point = { x: Math.floor(location.x), y: Math.floor(location.y), z: Math.floor(location.z) };
    id = await acquireLoadedArea(dimension, point, point, label);
    if (!entity.isValid) throw new TravelError("interrupted", label + ": entity left during travel");
    const prepare = preparations.get(dimension.id);
    if (dimension.id === "dbe:future_trunks" && !prepare)
      throw new TravelError("generation", label + ": Future terrain preparation is not initialized");
    if (prepare) {
      const requested = point;
      try {
        location = (await prepare(dimension, location, entity)) ?? location;
      } catch (error) {
        throw new TravelError("generation", label + ": " + (error?.message ?? String(error)), error);
      }
      if (![location.x, location.y, location.z].every(Number.isFinite))
        throw new TravelError("generation", label + ": preparation returned invalid coordinates");
      point = { x: Math.floor(location.x), y: Math.floor(location.y), z: Math.floor(location.z) };
      if (point.x !== requested.x || point.z !== requested.z)
        throw new TravelError("generation", label + ": preparation changed the requested column");
    }
    const requireGround = requestedGround || dimension.id === "dbe:future_trunks" ||
      (dimension.id === "minecraft:overworld" && origin.dimension !== dimension.id);
    if (requireGround) {
      try {
        if (!isSafeStanding(dimension, location))
          throw new Error("arrival floor or headroom is unsafe; no blocks were replaced. Check this destination before retrying");
      } catch (error) {
        throw new TravelError("arrival", label + ": " + (error?.message ?? String(error)), error);
      }
      teleportOptions.checkForBlocks = true;
    }
    if (!entity.isValid) throw new TravelError("interrupted", label + ": entity left during travel");
    const now = entity.location;
    if (entity.dimension.id !== origin.dimension || Math.hypot(now.x - origin.x, now.y - origin.y, now.z - origin.z) > 16) {
      throw new TravelError("interrupted", label + ": travel interrupted; retry from your current location");
    }
    try {
      entity.teleport(location, teleportOptions);
      afterTeleport = true;
    } catch (error) {
      throw new TravelError("teleport", label + ": " + (error?.message ?? String(error)), error);
    }
    await wait(2);
    if (!entity.isValid || entity.dimension.id !== dimension.id ||
        Math.hypot(entity.location.x - location.x, entity.location.y - location.y, entity.location.z - location.z) > 4)
      throw new TravelError("interrupted", label + ": arrival was interrupted; no progression was committed");
    if (requireGround && !isSafeStanding(dimension, entity.location))
      throw new TravelError("arrival", label + ": arrival support or headroom changed during travel");
  } catch (error) {
    if (destinationId) {
      const failure = error instanceof TravelError ? error : new TravelError("travel", error?.message ?? String(error), error);
      failure.destinationId = destinationId;
      if (afterTeleport) failure.afterTeleport = true;
      throw failure;
    }
    throw error;
  } finally {
    if (id) releaseLoadedArea(id);
  }
}
