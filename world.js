import {
  rand, randInt, clamp, fractalNoise, generateWorldName, generateId, BIOME_COLORS
} from './utils.js';

const GRID_SIZE = 48;

export class World {
  constructor() {
    this.id = generateId();
    this.name = generateWorldName();
    this.seed = randInt(1, 99999);
    this.epoch = 0;
    this.years = 0;
    this.yearsPerEpoch = 500000;

    this.temperature = rand(5, 35);
    this.o2 = rand(0, 5);
    this.co2 = rand(60, 95);
    this.waterCoverage = rand(40, 85);
    this.tectonicActivity = rand(0.1, 0.9);
    this.sunlight = rand(0.7, 1.0);
    this.magneticField = rand(0.3, 1.0);

    this.grid = this.generateTerrain();
    this.events = [];
    this.activeEffects = [];
  }

  generateTerrain() {
    const grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        const elevation = fractalNoise(x * 0.15, y * 0.15, this.seed, 5);
        const moisture = fractalNoise(x * 0.2 + 50, y * 0.2 + 50, this.seed, 4);
        const heat = fractalNoise(x * 0.1 + 100, y * 0.1, this.seed, 3);

        const isWater = elevation < (1 - this.waterCoverage / 100) * 0.45 + 0.1;
        let biome;

        if (isWater) {
          biome = elevation < 0.25 ? 'ocean' : 'coast';
        } else if (elevation > 0.82) {
          biome = this.tectonicActivity > 0.6 ? 'volcanic' : 'tundra';
        } else if (moisture < 0.3 && heat > 0.55) {
          biome = 'desert';
        } else if (moisture > 0.65 && elevation < 0.4) {
          biome = 'swamp';
        } else if (moisture > 0.45) {
          biome = 'forest';
        } else {
          biome = 'grassland';
        }

        row.push({ x, y, elevation, moisture, heat, biome, isWater });
      }
      grid.push(row);
    }
    return grid;
  }

  getBiomeCounts() {
    const counts = {};
    for (const row of this.grid) {
      for (const cell of row) {
        counts[cell.biome] = (counts[cell.biome] || 0) + 1;
      }
    }
    return counts;
  }

  getHabitability() {
    const tempScore = 1 - Math.abs(this.temperature - 22) / 30;
    const o2Score = clamp(this.o2 / 21, 0, 1);
    const waterScore = clamp(this.waterCoverage / 70, 0, 1);
    return clamp((tempScore + o2Score + waterScore) / 3, 0.05, 1);
  }

  tickEnvironment() {
    // Natural drift
    this.temperature += rand(-1.5, 1.5);
    this.temperature = clamp(this.temperature, -30, 60);

    // Photosynthesis slowly builds O2
    this.o2 += rand(0, 0.3);
    this.co2 = clamp(this.co2 - rand(0, 0.2), 5, 99);
    this.o2 = clamp(this.o2, 0, 35);

    // Tectonic events
    if (Math.random() < this.tectonicActivity * 0.08) {
      this.triggerTectonicEvent();
    }

    // Apply active effects
    this.activeEffects = this.activeEffects.filter(effect => {
      effect.apply(this);
      effect.remaining--;
      return effect.remaining > 0;
    });

    this.years += this.yearsPerEpoch;
    this.epoch++;
  }

  triggerTectonicEvent() {
    const events = [
      { type: 'earthquake', desc: 'A massive earthquake reshapes the land.' },
      { type: 'volcanic', desc: 'Volcanoes erupt, spewing ash and lava.' },
      { type: 'rift', desc: 'Continental rifting creates new ocean basins.' },
    ];
    const event = events[randInt(0, events.length - 1)];

    if (event.type === 'volcanic') {
      this.temperature += rand(1, 4);
      this.co2 += rand(2, 8);
    } else if (event.type === 'rift') {
      this.waterCoverage += rand(1, 3);
      this.waterCoverage = clamp(this.waterCoverage, 20, 95);
    }

    this.logEvent('disaster', event.desc);
    return event;
  }

  logEvent(type, message) {
    this.events.unshift({ type, message, epoch: this.epoch, years: this.years });
    if (this.events.length > 100) this.events.pop();
  }

  addEffect(effect) {
    this.activeEffects.push(effect);
  }

  getCellColor(cell) {
    const base = BIOME_COLORS[cell.biome] || '#333';
    return base;
  }
}

export class WorldEffect {
  constructor(name, duration, applyFn) {
    this.name = name;
    this.remaining = duration;
    this.apply = applyFn;
  }
}

export { GRID_SIZE };
