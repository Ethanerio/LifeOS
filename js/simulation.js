import { World } from './world.js';
import { LifeEngine } from './life.js';
import { DecisionManager } from './decisions.js';

export const MAX_EPOCHS = 30;
export const END_CONDITIONS = {
  SAPience: 'sapience',
  EXTINCTION: 'extinction',
  TIME: 'time',
};

export class Simulation {
  constructor() {
    this.world = null;
    this.life = null;
    this.decisions = null;
    this.running = false;
    this.ended = false;
    this.endReason = null;
    this.onUpdate = null;
    this.onEvent = null;
    this.onEnd = null;
  }

  newWorld() {
    this.world = new World();
    this.life = new LifeEngine(this.world);
    this.decisions = new DecisionManager(this.world, this.life);
    this.running = false;
    this.ended = false;
    this.endReason = null;

    // Seed initial life after a short delay conceptually (epoch 0)
    this.life.seedLife();
    this.notifyUpdate();
    return this;
  }

  advanceEpoch() {
    if (this.ended) return null;

    // Tick environment and life
    this.world.tickEnvironment();
    const events = this.life.tick();

    // Reset decision points for new epoch
    this.decisions.resetEpoch();

    // Check end conditions
    const endCheck = this.checkEndConditions();
    if (endCheck) {
      this.ended = true;
      this.endReason = endCheck;
      if (this.onEnd) this.onEnd(endCheck);
    }

    this.notifyUpdate();
    return events;
  }

  checkEndConditions() {
    if (this.life.sapientSpecies) {
      return {
        type: END_CONDITIONS.SAPience,
        title: 'Sapience Achieved!',
        desc: `${this.life.sapientSpecies.name} has developed consciousness and civilization. Your guidance led life to look upon the stars with understanding.`,
        icon: '🧠',
      };
    }

    if (this.life.getLiving().length === 0 && this.world.epoch > 2) {
      return {
        type: END_CONDITIONS.EXTINCTION,
        title: 'Silent World',
        desc: 'All life has perished. The world spins on, empty and quiet. Perhaps in another epoch, you will choose differently.',
        icon: '💀',
      };
    }

    if (this.world.epoch >= MAX_EPOCHS) {
      const peak = this.life.getIntelligencePeak();
      return {
        type: END_CONDITIONS.TIME,
        title: peak > 0.5 ? 'Age of Promise' : 'Deep Time',
        desc: peak > 0.5
          ? `Your epoch ends with life on the cusp of greatness. The most intelligent species reached ${(peak * 100).toFixed(0)}% intelligence.`
          : 'Eons pass. Life persists but has not yet reached for the stars. The story continues beyond your watch.',
        icon: '🌍',
      };
    }

    return null;
  }

  applyDecision(decisionId, choice) {
    if (this.ended) return null;
    const result = this.decisions.use(decisionId, choice);

    // Re-check end after decision (e.g., comet could seed life)
    const endCheck = this.checkEndConditions();
    if (endCheck) {
      this.ended = true;
      this.endReason = endCheck;
      if (this.onEnd) this.onEnd(endCheck);
    }

    this.notifyUpdate();
    return result;
  }

  notifyUpdate() {
    if (this.onUpdate) this.onUpdate(this.getState());
  }

  getState() {
    return {
      world: this.world,
      life: this.life,
      decisions: this.decisions,
      ended: this.ended,
      endReason: this.endReason,
    };
  }
}
