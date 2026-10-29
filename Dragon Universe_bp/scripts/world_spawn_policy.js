import { world, system } from "@minecraft/server";

const FUTURE = "dbe:future_trunks";
const excluded = new Set(["minecraft:zombie", "minecraft:skeleton", "minecraft:creeper", "minecraft:spider"]);

export function isExcludedFutureMob(entity) {
  return entity.dimension.id === FUTURE && excluded.has(entity.typeId);
}

function enforceFuture(entity) {
  try {
    if (entity.isValid && isExcludedFutureMob(entity)) entity.remove();
  } catch (error) {
    console.warn("[Future] spawn policy could not process entity: " + error);
  }
}

// Bedrock exposes spawn/load AFTER events, not a cancellable entity spawning event.
// Apply the exact dimension/type policy at those boundaries, without recurring entity scans.
world.afterEvents.entitySpawn.subscribe(({ entity }) => enforceFuture(entity));
world.afterEvents.entityLoad.subscribe(({ entity }) => enforceFuture(entity));
world.afterEvents.worldLoad.subscribe(() => {
  system.run(() => {
    try {
      // This mob event is the source of both the wandering trader and its two trader llamas.
      world.getDimension("minecraft:overworld").runCommand("mobevent minecraft:wandering_trader_event false");
    } catch (error) {
      console.warn("[World] could not disable wandering trader natural spawning: " + error);
    }
    try {
      for (const entity of world.getDimension(FUTURE).getEntities()) enforceFuture(entity);
    } catch (error) {
      console.warn("[Future] initial loaded-entity policy failed: " + error);
    }
  });
});
