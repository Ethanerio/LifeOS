import { Simulation } from './simulation.js';
import { UI } from './ui.js';

const sim = new Simulation();
const ui = new UI(sim);

sim.onUpdate = (state) => {
  ui.render();
};

sim.onEnd = (endReason) => {
  ui.showEndScreen(endReason);
};

// Initial render for start screen
console.log('✦ LifeOS — World Evolution Simulator loaded');
