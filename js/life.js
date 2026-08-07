import {
  rand, randInt, clamp, pick, generateId, generateSpeciesName,
  TRAIT_NAMES, DIET_TYPES, DIET_ICONS, formatNumber
} from './utils.js';

const TRAIT_KEYS = Object.keys(TRAIT_NAMES);

export class Species {
  constructor(options = {}) {
    this.id = generateId();
    this.name = options.name || generateSpeciesName();
    this.population = options.population || randInt(1000, 50000);
    this.alive = true;
    this.epochBorn = options.epochBorn || 0;
    this.parentId = options.parentId || null;
    this.generation = options.generation || 0;
    this.diet = options.diet || pick(DIET_TYPES);
    this.biome = options.biome || pick(['ocean', 'coast', 'grassland', 'forest', 'swamp']);
    this.color = options.color || `hsl(${randInt(0, 360)}, ${randInt(50, 80)}%, ${randInt(45, 65)}%)`;

    this.traits = {
      size: options.traits?.size ?? rand(0.1, 1),
      speed: options.traits?.speed ?? rand(0.1, 1),
      intelligence: options.traits?.intelligence ?? rand(0, 0.15),
      reproduction: options.traits?.reproduction ?? rand(0.3, 1),
      adaptability: options.traits?.adaptability ?? rand(0.2, 0.8),
      aggression: options.traits?.aggression ?? rand(0, 0.7),
      cooperation: options.traits?.cooperation ?? rand(0, 0.5),
      camouflage: options.traits?.camouflage ?? rand(0, 0.6),
    };

    this.mutationRate = rand(0.02, 0.08);
    this.descendants = [];
  }

  get icon() {
    return DIET_ICONS[this.diet] || '🧬';
  }

  get isSapient() {
    return this.traits.intelligence >= 0.85 && this.alive;
  }

  fitness(world) {
    const hab = world.getHabitability();
    let score = hab * this.traits.adaptability;

    // Diet bonuses
    if (this.diet === 'photosynthetic' && world.o2 < 5) score += 0.3;
    if (this.diet === 'filter' && this.biome === 'ocean') score += 0.2;
    if (this.diet === 'predator') score += this.traits.aggression * 0.2;
    if (this.diet === 'decomposer') score += 0.15;

    // Temperature adaptation
    const tempDiff = Math.abs(world.temperature - 20);
    score -= tempDiff * 0.01 * (1 - this.traits.adaptability);

    // O2 requirement for complex life
    if (this.traits.size > 0.5) score *= clamp(world.o2 / 10, 0.1, 1);

    // Intelligence needs O2 and stability
    if (this.traits.intelligence > 0.3) {
      score *= clamp(world.o2 / 15, 0.05, 1);
    }

    return clamp(score, 0.01, 2);
  }

  tick(world, allSpecies) {
    if (!this.alive) return null;

    const fitness = this.fitness(world);
    const growthRate = fitness * this.traits.reproduction * rand(0.5, 1.5);
    const deathRate = (1 - fitness) * rand(0.1, 0.5);

    // Competition from similar species
    const competitors = allSpecies.filter(s =>
      s.alive && s.id !== this.id && s.biome === this.biome
    );
    const competitionPressure = competitors.reduce((sum, s) => {
      return sum + s.population * s.traits.aggression * 0.000001;
    }, 0);

    let popChange = this.population * (growthRate - deathRate - competitionPressure);
    this.population += popChange;
    this.population = Math.max(0, this.population);

    // Extinction check
    if (this.population < 10) {
      this.alive = false;
      this.population = 0;
      return { type: 'extinction', species: this };
    }

    // Mutation / speciation
    let speciation = null;
    if (Math.random() < this.mutationRate * fitness) {
      speciation = this.mutate(world);
    }

    return speciation;
  }

  mutate(world) {
    const child = new Species({
      name: generateSpeciesName(),
      population: randInt(100, Math.max(200, this.population * 0.1)),
      epochBorn: world.epoch,
      parentId: this.id,
      generation: this.generation + 1,
      diet: Math.random() < 0.15 ? pick(DIET_TYPES) : this.diet,
      biome: Math.random() < 0.2 ? pick(['ocean', 'coast', 'grassland', 'forest', 'swamp', 'desert', 'tundra']) : this.biome,
      traits: { ...this.traits },
    });

    // Mutate 1-3 traits
    const numMutations = randInt(1, 3);
    for (let i = 0; i < numMutations; i++) {
      const trait = pick(TRAIT_KEYS);
      const delta = rand(-0.15, 0.15);
      child.traits[trait] = clamp(this.traits[trait] + delta, 0, 1);
    }

    // Occasional intelligence leap
    if (Math.random() < 0.05 + world.o2 * 0.005) {
      child.traits.intelligence = clamp(child.traits.intelligence + rand(0.05, 0.15), 0, 1);
    }

    this.descendants.push(child.id);
    child.mutationRate = this.mutationRate + rand(-0.01, 0.01);

    return { type: 'speciation', parent: this, child };
  }

  applyTraitBoost(trait, amount) {
    if (this.traits[trait] !== undefined) {
      this.traits[trait] = clamp(this.traits[trait] + amount, 0, 1);
    }
  }

  getTopTraits(n = 3) {
    return Object.entries(this.traits)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n);
  }
}

export class LifeEngine {
  constructor(world) {
    this.world = world;
    this.species = [];
    this.extinct = [];
    this.totalSpeciations = 0;
    this.sapientSpecies = null;
  }

  seedLife() {
    const primordial = new Species({
      name: 'Primordial Soup',
      population: randInt(100000, 500000),
      epochBorn: 0,
      diet: 'photosynthetic',
      biome: 'ocean',
      traits: {
        size: 0.05, speed: 0.1, intelligence: 0,
        reproduction: 0.9, adaptability: 0.7,
        aggression: 0, cooperation: 0.1, camouflage: 0.2,
      },
    });
    this.species.push(primordial);
    this.world.logEvent('milestone', 'Life emerges from the primordial oceans.');
    return primordial;
  }

  tick() {
    const events = [];
    const living = this.species.filter(s => s.alive);

    for (const species of living) {
      const result = species.tick(this.world, living);
      if (!result) continue;

      if (result.type === 'extinction') {
        this.extinct.push(result.species);
        events.push({
          type: 'extinction',
          message: `${result.species.name} has gone extinct.`,
        });
      } else if (result.type === 'speciation') {
        this.species.push(result.child);
        this.totalSpeciations++;
        events.push({
          type: 'evolution',
          message: `${result.child.name} diverged from ${result.parent.name}.`,
        });

        // Check for intelligence milestones
        if (result.child.traits.intelligence > 0.5 && result.parent.traits.intelligence <= 0.5) {
          events.push({
            type: 'milestone',
            message: `${result.child.name} shows signs of emerging intelligence.`,
          });
        }
      }
    }

    // Check for sapience
    for (const s of this.species) {
      if (s.isSapient && !this.sapientSpecies) {
        this.sapientSpecies = s;
        events.push({
          type: 'milestone',
          message: `${s.name} has achieved sapience! They look to the stars.`,
        });
      }
    }

    // Log events to world
    for (const e of events) {
      this.world.logEvent(e.type, e.message);
    }

    return events;
  }

  getLiving() {
    return this.species.filter(s => s.alive);
  }

  getBiodiversity() {
    const living = this.getLiving();
    if (living.length === 0) return 0;
    const maxSpecies = 20;
    return clamp(Math.round((living.length / maxSpecies) * 100), 0, 100);
  }

  getIntelligencePeak() {
    const living = this.getLiving();
    if (living.length === 0) return 0;
    return Math.max(...living.map(s => s.traits.intelligence));
  }

  getSpeciesById(id) {
    return this.species.find(s => s.id === id);
  }

  boostSpecies(id, trait, amount) {
    const s = this.getSpeciesById(id);
    if (s) s.applyTraitBoost(trait, amount);
  }

  protectSpecies(id) {
    const s = this.getSpeciesById(id);
    if (s) {
      s.population = Math.max(s.population, randInt(50000, 200000));
      s.traits.adaptability = clamp(s.traits.adaptability + 0.2, 0, 1);
    }
  }

  killRandomFraction(fraction) {
    for (const s of this.getLiving()) {
      s.population *= (1 - fraction);
      if (s.population < 10) {
        s.alive = false;
        s.population = 0;
        this.extinct.push(s);
        this.world.logEvent('extinction', `${s.name} was wiped out by catastrophe.`);
      }
    }
  }
}

export { TRAIT_NAMES, DIET_ICONS, formatNumber };
