// TEMPORARY measurement for the travel test package (planets and Kaioshin). Not for release.
// Release: set DU_TRAVEL_TIMING = false (every call becomes a no-op), or delete this file and its imports
// (grep "travel_timing" / "timing?."). Lines go to the Content Log with the prefix [Timing].
import { system } from "@minecraft/server";

export const DU_TRAVEL_TIMING = true;

let serial = 0;

/** A timer for one trip, or undefined when the flag is off. mark() logs the game tick and the wall clock,
 *  with the change since the previous mark (d) and since the start (t). */
export function travelTimer(label) {
  if (!DU_TRAVEL_TIMING) return undefined;
  const name = label + " #" + ++serial;
  const startTick = system.currentTick, startMs = Date.now();
  let lastTick = startTick, lastMs = startMs;
  return {
    mark(phase, detail) {
      try {
        const tick = system.currentTick, ms = Date.now();
        console.warn("[Timing] " + name + " " + phase + (detail ? " (" + detail + ")" : "") + " currentTick=" + tick + " now=" + ms +
          " dTicks=" + (tick - lastTick) + " dMs=" + (ms - lastMs) + " tTicks=" + (tick - startTick) + " tMs=" + (ms - startMs));
        lastTick = tick;
        lastMs = ms;
      } catch (error) { /* measurement never breaks travel */ }
    },
  };
}
