/** Utility functions for the simulation */

export function rand(min, max) {
  return Math.random() * (max - min) + min;
}

export function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

export function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Simple seeded noise for terrain generation */
export function noise2D(x, y, seed = 42) {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
  return n - Math.floor(n);
}

export function smoothNoise(x, y, seed) {
  const corners = (noise2D(x - 1, y - 1, seed) + noise2D(x + 1, y - 1, seed) +
                   noise2D(x - 1, y + 1, seed) + noise2D(x + 1, y + 1, seed)) / 16;
  const sides = (noise2D(x - 1, y, seed) + noise2D(x + 1, y, seed) +
                 noise2D(x, y - 1, seed) + noise2D(x, y + 1, seed)) / 8;
  const center = noise2D(x, y, seed) / 4;
  return corners + sides + center;
}

export function fractalNoise(x, y, seed, octaves = 4) {
  let total = 0, amp = 1, freq = 1, maxVal = 0;
  for (let i = 0; i < octaves; i++) {
    total += smoothNoise(x * freq, y * freq, seed + i * 100) * amp;
    maxVal += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return total / maxVal;
}

export const WORLD_NAMES = [
  'Aetheria', 'Verdania', 'Caldara', 'Nyxos', 'Thalassa',
  'Ferrum', 'Luminos', 'Obsidian', 'Zephyra', 'Crystallis',
  'Emberfall', 'Mistral', 'Gaiana', 'Helios', 'Nocturne',
];

export const SPECIES_PREFIXES = [
  'Proto', 'Micro', 'Nano', 'Archeo', 'Primordial',
  'Ancient', 'Deep', 'Shadow', 'Bright', 'Swift',
];

export const SPECIES_SUFFIXES = [
  'form', 'pod', 'crawl', 'swim', 'fly',
  'root', 'shell', 'fin', 'claw', 'wing',
];

export const TRAIT_NAMES = {
  size: 'Size',
  speed: 'Speed',
  intelligence: 'Intelligence',
  reproduction: 'Reproduction',
  adaptability: 'Adaptability',
  aggression: 'Aggression',
  cooperation: 'Cooperation',
  camouflage: 'Camouflage',
};

export const DIET_TYPES = ['photosynthetic', 'filter', 'predator', 'omnivore', 'decomposer'];

export const DIET_ICONS = {
  photosynthetic: '🌱',
  filter: '🫧',
  predator: '🦷',
  omnivore: '🍖',
  decomposer: '♻️',
};

export const BIOME_COLORS = {
  ocean: '#1e4d7b',
  coast: '#2a6b8a',
  grassland: '#3d7a4a',
  forest: '#2d5a3d',
  desert: '#8b6914',
  tundra: '#a8c4d4',
  volcanic: '#6b2a1a',
  swamp: '#4a5a3a',
};

export function formatNumber(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.round(n).toString();
}

export function formatYears(years) {
  if (years >= 1e9) return (years / 1e9).toFixed(2) + ' billion';
  if (years >= 1e6) return (years / 1e6).toFixed(1) + ' million';
  if (years >= 1e3) return (years / 1e3).toFixed(0) + ' thousand';
  return years.toString();
}

export function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export function generateSpeciesName() {
  return pick(SPECIES_PREFIXES) + pick(SPECIES_SUFFIXES);
}

export function generateWorldName() {
  return pick(WORLD_NAMES);
}
