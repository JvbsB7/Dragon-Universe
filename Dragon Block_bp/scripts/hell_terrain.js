/**
 * Terrain maths for the Hell dimension (dbe:hell). No game imports, so it can be unit-tested in Node.
 *
 * Layout (all deterministic from x / z):
 *   - a flat plateau around the Hell Gate at the origin (the arrival plaza),
 *   - cracked red wasteland of netherrack with low ridges,
 *   - Blood Ponds (water, tinted red by the client biome) and lava lakes in the low basins,
 *   - Needle Mountains: clusters of thin, very tall black rock spires.
 * Blood and lava never touch: the strip between them is forced to dry rock.
 */

export const MIN_Y = -64;
export const LEVEL = 58; // surface of the Blood Ponds and lava lakes
export const PLAZA_Y = 68; // height of the arrival plaza
export const CENTER = { x: 8, z: 8 }; // middle of chunk (0,0); the Hell Gate stands here
export const PLAZA_R = 26;
const BLEND_R = 26;
const SEED = 0x48454c4c; // "HELL"

function hash2(ix, iz) {
  let h = (Math.imul(ix | 0, 374761393) + Math.imul(iz | 0, 668265263) + SEED) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (t) => t * t * (3 - 2 * t);
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);

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

/** Distance from the plaza centre. */
export const distCenter = (x, z) => Math.hypot(x - CENTER.x, z - CENTER.z);

/** Which liquid fills low ground at this column's lake: value of the "lava vs blood" noise. */
const lavaNoise = (x, z) => fbm(x / 230 + 11, z / 230 - 11, 2);
const LAVA_AT = 0.54; // lava above this value, blood below
const BUFFER = 0.022; // dry strip kept either side of the threshold

/** Terrain height of the top solid block in a column (before the dry-strip rule). */
function rawHeight(x, z) {
  const broad = fbm(x / 95, z / 95, 4);
  let h = 69 + (broad - 0.5) * 30;
  h += (fbm(x / 22 + 40, z / 22 - 40, 2) - 0.5) * 5; // cracked, uneven ground

  // basins for the ponds / lava lakes
  const p = fbm(x / 110 + 77, z / 110 - 77, 3);
  h -= 26 * smooth(clamp01((p - 0.55) / 0.15));

  // Needle Mountains: only inside "needle country", thin spires on a ridged base
  const country = smooth(clamp01((fbm(x / 210 + 500, z / 210 - 500, 2) - 0.5) / 0.12));
  if (country > 0) {
    const ridge = 1 - Math.abs(2 * fbm(x / 55 + 300, z / 55 - 300, 3) - 1);
    h += country * Math.pow(ridge, 3) * 26; // rocky ridges
    const s = valueNoise(x / 6.5 + 900, z / 6.5 - 900);
    h += country * Math.pow(clamp01((s - 0.55) / 0.45), 2.2) * 95; // the needles
  }

  // flat arrival plaza, blended into the wilds
  const d = distCenter(x, z);
  if (d < PLAZA_R + BLEND_R) {
    const k = d <= PLAZA_R ? 0 : smooth((d - PLAZA_R) / BLEND_R);
    h = PLAZA_Y + (h - PLAZA_Y) * k;
  }
  return h;
}

/** Surface height (top solid block) at a world column. */
export function heightAt(x, z) {
  let h = Math.floor(rawHeight(x, z));
  // blood and lava must never touch: low ground along the border between them becomes a dry rock bridge
  if (h < LEVEL && Math.abs(lavaNoise(x, z) - LAVA_AT) < BUFFER) h = LEVEL + 1;
  return Math.max(24, Math.min(180, h));
}

/** 0 = dry, 1 = Blood Pond, 2 = lava lake (liquid fills from the surface up to LEVEL). */
export function liquidAt(x, z, h) {
  const hh = h === undefined ? heightAt(x, z) : h;
  if (hh >= LEVEL) return 0;
  return lavaNoise(x, z) > LAVA_AT ? 2 : 1;
}

// ground materials
export const CORE = "minecraft:blackstone";
export const GROUND = "minecraft:netherrack";
export const HIGH_ROCK = "minecraft:blackstone";
export const HIGH_Y = 82; // above this the rock is black needle-stone, below it red netherrack

/** Block that covers the top of a dry column. */
export function topBlock(h) {
  return h > HIGH_Y ? HIGH_ROCK : GROUND;
}
