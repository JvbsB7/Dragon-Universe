import { acquireLoadedArea, releaseLoadedArea, safeTeleport, travelOrigin } from "./travel_safety.js";
/**
 * Planet of the Kais in the Other World.
 *
 * A green-and-pink planet sphere floats in the Other World (dbe:other_world), like the planets that float in
 * space. Fly into it to land on the Kai planet (dbe:kai, built by kai_dimension.js). If you came from the Other
 * World, flying up on Kai (y >= 300) brings you back there, next to the planet; if you came from space or Earth,
 * keep climbing to y >= 500 to reach the Orbital Station. The Kid Buu quest happens on Kai.
 *
 * The sphere is built once, the first time a player is in the Other World. Move or rebuild it:
 *   /scriptevent dbe:kai_planet_here    -> removes the old planet and builds a new one at your position
 *   /scriptevent dbe:kai_planet_rebuild -> rebuilds it where it is
 */
import * as mc from "@minecraft/server";

const { world, system } = mc;

const OTHER_WORLD = "dbe:other_world";
const KAI = "dbe:kai";
const PROP = "dbe:ow_kai_planet"; // JSON {x,y,z,r}, saved with the world
const DEFAULT_PLANET = { x: 0, y: 120, z: 120, r: 12 };
const REACH = 2.5; // how close to the surface counts as "flying into it"
const KAI_EXIT_Y = 300; // fly this high on Kai to go back to the Other World (only if you came from it)
const KAI_ORIGIN_PROP = "dbe:kai_origin"; // where the player left for Kai, saved by kai_dimension.js
const SCAN_TICKS = 5;

const waitTicks = (n) => new Promise((resolve) => system.runTimeout(resolve, n));

function hash3(x, y, z) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1274126177) + 0x4b4149) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Same colours as the old space sphere: green terraces, brown cliffs, pink bulbs, light blue rivers. */
function planetBlock(x, y, z) {
  const n = hash3(Math.floor(x / 3), Math.floor(y / 3), Math.floor(z / 3));
  const m = hash3(x, y, z);
  if (m > 0.93) return "minecraft:pink_concrete";
  if (n > 0.68) return "minecraft:brown_terracotta";
  if (n > 0.5) return "minecraft:lime_concrete";
  return n > 0.36 ? "minecraft:green_concrete" : "minecraft:light_blue_concrete";
}

function loadPlanet() {
  try {
    const raw = world.getDynamicProperty(PROP);
    if (typeof raw === "string") {
      const p = JSON.parse(raw);
      if (p && typeof p.x === "number" && typeof p.y === "number" && typeof p.z === "number" && typeof p.r === "number") return p;
    }
  } catch (e) {
    /* ignore */
  }
  return null;
}

/** Walks every shell block of the sphere; `fn(x, y, z)` is called for each. */
function* shell(P, fn) {
  const r = P.r;
  let n = 0;
  for (let dx = -r; dx <= r; dx++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dz = -r; dz <= r; dz++) {
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d > r + 0.3 || d < r - 2) continue; // 2 blocks thick
        fn(P.x + dx, P.y + dy, P.z + dz);
        if (++n % 300 === 0) yield;
      }
    }
  }
}

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

async function withLoadedArea(dim, P, work) {
  const pad = 16;
  const from = { x: P.x - P.r - pad, y: P.y, z: P.z - P.r - pad };
  const to = { x: P.x + P.r + pad, y: P.y, z: P.z + P.r + pad };
  const area = await acquireLoadedArea(dim, from, to, "Kaioshin orbital sphere");
  try {
    await work();
  } finally {
    releaseLoadedArea(area);
  }
}

let building = false;

async function buildPlanet(P, clearOld) {
  if (building) return;
  building = true;
  try {
    const dim = world.getDimension(OTHER_WORLD);
    if (clearOld) {
      await withLoadedArea(dim, clearOld, async () => {
        await runJobAsync(
          shell(clearOld, (x, y, z) => {
            try {
              dim.setBlockType({ x, y, z }, "minecraft:air");
            } catch (e) {
              /* unloaded */
            }
          })
        );
      });
    }
    await withLoadedArea(dim, P, async () => {
      await runJobAsync(
        shell(P, (x, y, z) => {
          try {
            dim.setBlockType({ x, y, z }, planetBlock(x, y, z));
          } catch (e) {
            /* unloaded */
          }
        })
      );
    });
    world.setDynamicProperty(PROP, JSON.stringify(P));
  } catch (e) {
    console.warn("[KaiPlanet] build failed (will retry): " + e);
  } finally {
    building = false;
  }
}

// ---------------------------------------------------------------- flying in and out

const lastUse = new Map();
const cooldownOk = (p) => system.currentTick - (lastUse.get(p.id) ?? -1000) > 120;

/**
 * Only players who flew in from the Other World go back there at KAI_EXIT_Y. Everyone else keeps climbing to
 * y >= 500, where space_planets.js sends them to the Orbital Station.
 */
function cameFromOtherWorld(player) {
  try {
    const raw = player.getDynamicProperty(KAI_ORIGIN_PROP);
    return typeof raw === "string" && JSON.parse(raw).d === OTHER_WORLD;
  } catch (e) {
    return false;
  }
}

async function enterKai(player, P) {
  lastUse.set(player.id, system.currentTick);
  const { x, y, z } = player.location;
  // Stand the player a few blocks outside the planet first, so that is the spot they come back to.
  let vx = x - P.x;
  let vy = y - P.y;
  let vz = z - P.z;
  let len = Math.hypot(vx, vy, vz);
  if (len < 0.001) {
    vx = 0;
    vy = 0;
    vz = 1;
    len = 1;
  }
  const out = P.r + 8;
  try {
    await safeTeleport(player, { x: P.x + (vx / len) * out, y: P.y + (vy / len) * out, z: P.z + (vz / len) * out });
  } catch (e) {
    console.warn("[KaiPlanet] entry interrupted: " + e);
    return;
  }
  player.sendMessage("§dEntering Kaioshin Planet...");
  system.runTimeout(() => {
    try {
      player.runCommand("scriptevent dbe:kai");
    } catch (e) {
      console.warn("[KaiPlanet] could not enter Kai: " + e);
    }
  }, 4);
}

function scan() {
  const P = loadPlanet();
  for (const p of world.getPlayers()) {
    const dimId = p.dimension.id;
    if (dimId === OTHER_WORLD) {
      if (!P) {
        if (!building) buildPlanet(DEFAULT_PLANET, null);
        continue;
      }
      const { x, y, z } = p.location;
      if (Math.hypot(x - P.x, y - P.y, z - P.z) < P.r + REACH && cooldownOk(p)) enterKai(p, P);
    } else if (dimId === KAI) {
      if (p.location.y >= KAI_EXIT_Y && cooldownOk(p) && cameFromOtherWorld(p)) {
        lastUse.set(p.id, system.currentTick);
        try {
          p.runCommand("scriptevent dbe:kai_return");
        } catch (e) {
          console.warn("[KaiPlanet] could not leave Kai: " + e);
        }
      }
    }
  }
}

world.afterEvents.worldLoad.subscribe(() => {
  system.runInterval(() => {
    try {
      scan();
    } catch (e) {
      console.warn("[KaiPlanet] scan error: " + e);
    }
  }, SCAN_TICKS);

  system.afterEvents.scriptEventReceive.subscribe((ev) => {
    const src = ev.sourceEntity;
    if (!src || src.typeId !== "minecraft:player") return;
    if (ev.id === "dbe:kai_planet_here") {
      if (src.dimension.id !== OTHER_WORLD) {
        src.sendMessage("§cDo this in the Other World.");
        return;
      }
      const old = loadPlanet();
      const { x, y, z } = src.location;
      const P = { x: Math.floor(x), y: Math.floor(y) + 14, z: Math.floor(z), r: 12 };
      src.sendMessage("§dBuilding Kaioshin Planet here...");
      buildPlanet(P, old);
    } else if (ev.id === "dbe:kai_planet_rebuild") {
      const P = loadPlanet() ?? DEFAULT_PLANET;
      buildPlanet(P, null);
    }
  });
});
