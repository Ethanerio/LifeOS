import { rand, clamp, pick } from './utils.js';
import { WorldEffect } from './world.js';

export const DECISIONS = [
  {
    id: 'warm_climate',
    name: 'Warm the Climate',
    icon: '☀️',
    desc: 'Increase global temperature, favoring heat-adapted life.',
    apply: (world, life) => {
      world.temperature += rand(3, 8);
      world.logEvent('decision', 'You bathe the world in warmth. Ice retreats.');
      return 'The world grows warmer.';
    },
  },
  {
    id: 'cool_climate',
    name: 'Ice Age',
    icon: '❄️',
    desc: 'Drop temperatures dramatically, testing adaptability.',
    apply: (world, life) => {
      world.temperature -= rand(5, 12);
      life.killRandomFraction(0.15);
      world.logEvent('decision', 'An ice age descends. Only the adaptable survive.');
      return 'A great freeze tests all life.';
    },
  },
  {
    id: 'oxygen_bloom',
    name: 'Oxygen Bloom',
    icon: '💨',
    desc: 'Surge atmospheric oxygen, enabling complex organisms.',
    apply: (world, life) => {
      world.o2 += rand(3, 8);
      world.o2 = clamp(world.o2, 0, 35);
      world.co2 -= rand(5, 15);
      world.logEvent('decision', 'Photosynthesis runs wild. The air grows rich with oxygen.');
      return 'Oxygen levels surge.';
    },
  },
  {
    id: 'meteor_strike',
    name: 'Meteor Strike',
    icon: '☄️',
    desc: 'A devastating impact. Mass extinction, but new niches open.',
    apply: (world, life) => {
      world.temperature -= rand(2, 6);
      world.co2 += rand(10, 25);
      life.killRandomFraction(0.4);
      world.tectonicActivity = clamp(world.tectonicActivity + 0.2, 0, 1);
      world.logEvent('decision', 'A meteor tears across the sky. Fire and darkness follow.');
      return 'The sky falls. Life is decimated.';
    },
  },
  {
    id: 'genetic_catalyst',
    name: 'Genetic Catalyst',
    icon: '🧪',
    desc: 'Boost mutation rates across all living species.',
    requiresModal: true,
    apply: (world, life, choice) => {
      if (choice === 'all') {
        for (const s of life.getLiving()) {
          s.mutationRate = clamp(s.mutationRate + 0.05, 0, 0.3);
        }
        world.logEvent('decision', 'You stir the primordial code. Mutations accelerate everywhere.');
        return 'All species mutate faster.';
      } else {
        const s = life.getSpeciesById(choice);
        if (s) {
          s.mutationRate = clamp(s.mutationRate + 0.1, 0, 0.3);
          world.logEvent('decision', `You catalyze the genome of ${s.name}.`);
          return `${s.name} evolves rapidly.`;
        }
      }
    },
    getOptions: (world, life) => {
      const opts = [{ id: 'all', label: 'All Species', desc: 'Boost mutation rate for every living species.' }];
      for (const s of life.getLiving()) {
        opts.push({ id: s.id, label: s.name, desc: `Focus mutations on ${s.name}.` });
      }
      return opts;
    },
  },
  {
    id: 'intelligence_nudge',
    name: 'Spark of Reason',
    icon: '🧠',
    desc: 'Nudge a species toward higher intelligence.',
    requiresModal: true,
    apply: (world, life, choice) => {
      const s = life.getSpeciesById(choice);
      if (s) {
        s.applyTraitBoost('intelligence', rand(0.08, 0.18));
        s.applyTraitBoost('cooperation', rand(0.05, 0.12));
        world.logEvent('decision', `You whisper thought into ${s.name}.`);
        return `${s.name} grows smarter.`;
      }
    },
    getOptions: (world, life) => {
      return life.getLiving()
        .sort((a, b) => b.traits.intelligence - a.traits.intelligence)
        .slice(0, 8)
        .map(s => ({
          id: s.id,
          label: `${s.name} (INT: ${(s.traits.intelligence * 100).toFixed(0)}%)`,
          desc: `Boost intelligence of ${s.name}.`,
        }));
    },
    isAvailable: (world, life) => life.getLiving().length > 0 && world.o2 > 3,
  },
  {
    id: 'sanctuary',
    name: 'Sanctuary',
    icon: '🛡️',
    desc: 'Protect a species from extinction, boosting its population.',
    requiresModal: true,
    apply: (world, life, choice) => {
      const s = life.getSpeciesById(choice);
      if (s) {
        life.protectSpecies(choice);
        world.logEvent('decision', `You shield ${s.name} from the harsh world.`);
        return `${s.name} thrives under your protection.`;
      }
    },
    getOptions: (world, life) => {
      return life.getLiving()
        .sort((a, b) => a.population - b.population)
        .slice(0, 8)
        .map(s => ({
          id: s.id,
          label: `${s.name} (${Math.round(s.population).toLocaleString()})`,
          desc: `Protect the endangered ${s.name}.`,
        }));
    },
    isAvailable: (world, life) => life.getLiving().length > 0,
  },
  {
    id: 'abundant_seas',
    name: 'Abundant Seas',
    icon: '🌊',
    desc: 'Expand oceans and enrich marine nutrients.',
    apply: (world, life) => {
      world.waterCoverage = clamp(world.waterCoverage + rand(3, 8), 20, 95);
      for (const s of life.getLiving()) {
        if (s.biome === 'ocean' || s.biome === 'coast') {
          s.population *= rand(1.3, 2.0);
        }
      }
      world.logEvent('decision', 'The seas swell with abundance.');
      return 'Ocean life flourishes.';
    },
  },
  {
    id: 'volcanic_fury',
    name: 'Volcanic Fury',
    icon: '🌋',
    desc: 'Unleash volcanic activity. Destruction and new land.',
    apply: (world, life) => {
      world.tectonicActivity = clamp(world.tectonicActivity + 0.3, 0, 1);
      world.temperature += rand(2, 5);
      world.co2 += rand(5, 12);
      life.killRandomFraction(0.2);
      world.addEffect(new WorldEffect('volcanic_winter', 3, (w) => {
        w.temperature -= 0.5;
      }));
      world.logEvent('decision', 'The earth splits open. Volcanoes reshape the world.');
      return 'Volcanoes reshape the planet.';
    },
  },
  {
    id: 'golden_age',
    name: 'Golden Age',
    icon: '✨',
    desc: 'A period of peace and prosperity for all life.',
    apply: (world, life) => {
      for (const s of life.getLiving()) {
        s.population *= rand(1.5, 2.5);
        s.traits.adaptability = clamp(s.traits.adaptability + 0.05, 0, 1);
      }
      world.addEffect(new WorldEffect('golden_age', 4, (w) => {
        w.temperature += rand(-0.3, 0.3);
      }));
      world.logEvent('decision', 'You bless the world with a golden age of prosperity.');
      return 'Life enters a golden age.';
    },
    isAvailable: (world, life) => life.getLiving().length >= 2,
  },
  {
    id: 'mass_extinction',
    name: 'Great Filter',
    icon: '💀',
    desc: 'Wipe out 60% of all species. Only the strongest remain.',
    apply: (world, life) => {
      const living = life.getLiving();
      const toKill = Math.ceil(living.length * 0.6);
      const shuffled = living.sort(() => Math.random() - 0.5);
      for (let i = 0; i < toKill && i < shuffled.length; i++) {
        shuffled[i].alive = false;
        shuffled[i].population = 0;
        life.extinct.push(shuffled[i]);
        world.logEvent('extinction', `${shuffled[i].name} perishes in the Great Filter.`);
      }
      world.logEvent('decision', 'You cull the weak. Evolution accelerates.');
      return 'The Great Filter reshapes life forever.';
    },
    isAvailable: (world, life) => life.getLiving().length >= 4,
  },
  {
    id: 'comet_water',
    name: 'Comet Delivery',
    icon: '💧',
    desc: 'Deliver water and organic compounds via comet impacts.',
    apply: (world, life) => {
      world.waterCoverage = clamp(world.waterCoverage + rand(2, 5), 20, 95);
      if (life.getLiving().length === 0) {
        life.seedLife();
      } else {
        for (const s of life.getLiving()) {
          s.population *= rand(1.1, 1.4);
        }
      }
      world.logEvent('decision', 'Comets rain from the heavens, bringing water and building blocks of life.');
      return 'Comets deliver the seeds of life.';
    },
  },
];

export class DecisionManager {
  constructor(world, life) {
    this.world = world;
    this.life = life;
    this.pointsPerEpoch = 1;
    this.remainingPoints = 1;
    this.usedThisEpoch = [];
    this.history = [];
  }

  resetEpoch() {
    this.remainingPoints = this.pointsPerEpoch;
    this.usedThisEpoch = [];
  }

  getAvailableDecisions() {
    return DECISIONS.filter(d => {
      if (d.isAvailable && !d.isAvailable(this.world, this.life)) return false;
      if (d.requiresModal && d.getOptions) {
        const opts = d.getOptions(this.world, this.life);
        if (!opts || opts.length === 0) return false;
      }
      return true;
    });
  }

  canUse(decisionId) {
    return this.remainingPoints > 0 && !this.usedThisEpoch.includes(decisionId);
  }

  use(decisionId, choice = null) {
    const decision = DECISIONS.find(d => d.id === decisionId);
    if (!decision || !this.canUse(decisionId)) return null;

    const result = decision.apply(this.world, this.life, choice);
    this.remainingPoints--;
    this.usedThisEpoch.push(decisionId);
    this.history.push({ decision: decisionId, epoch: this.world.epoch, result });

    return { decision, result };
  }
}

export function getRandomDecisions(count, world, life) {
  const available = DECISIONS.filter(d => {
    if (d.isAvailable && !d.isAvailable(world, life)) return false;
    return true;
  });
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
