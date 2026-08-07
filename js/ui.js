import { GRID_SIZE } from './world.js';
import { TRAIT_NAMES, DIET_ICONS, formatNumber } from './life.js';
import { DECISIONS } from './decisions.js';
import { clamp, formatYears } from './utils.js';

export class UI {
  constructor(simulation) {
    this.sim = simulation;
    this.pendingDecision = null;
    this.initElements();
    this.bindEvents();
  }

  initElements() {
    this.screens = {
      start: document.getElementById('start-screen'),
      game: document.getElementById('game-screen'),
      end: document.getElementById('end-screen'),
    };

    this.worldCanvas = document.getElementById('world-canvas');
    this.worldCtx = this.worldCanvas.getContext('2d');
    this.treeCanvas = document.getElementById('tree-canvas');
    this.treeCtx = this.treeCanvas.getContext('2d');

    this.els = {
      worldName: document.getElementById('world-name'),
      epoch: document.getElementById('epoch-display'),
      years: document.getElementById('years-display'),
      speciesCount: document.getElementById('species-count'),
      biodiversity: document.getElementById('biodiversity'),
      intelligencePeak: document.getElementById('intelligence-peak'),
      barTemp: document.getElementById('bar-temp'),
      barO2: document.getElementById('bar-o2'),
      barWater: document.getElementById('bar-water'),
      barTectonic: document.getElementById('bar-tectonic'),
      valTemp: document.getElementById('val-temp'),
      valO2: document.getElementById('val-o2'),
      valWater: document.getElementById('val-water'),
      valTectonic: document.getElementById('val-tectonic'),
      speciesList: document.getElementById('species-list'),
      eventLog: document.getElementById('event-log'),
      decisionsList: document.getElementById('decisions-list'),
      decisionPoints: document.getElementById('decision-points'),
      btnAdvance: document.getElementById('btn-advance'),
      modal: document.getElementById('decision-modal'),
      modalTitle: document.getElementById('modal-title'),
      modalDesc: document.getElementById('modal-desc'),
      modalOptions: document.getElementById('modal-options'),
      toastContainer: document.getElementById('toast-container'),
      endIcon: document.getElementById('end-icon'),
      endTitle: document.getElementById('end-title'),
      endDesc: document.getElementById('end-desc'),
      endStats: document.getElementById('end-stats'),
    };
  }

  bindEvents() {
    document.getElementById('btn-new-world').addEventListener('click', () => this.startGame());
    document.getElementById('btn-restart').addEventListener('click', () => this.showScreen('start'));
    this.els.btnAdvance.addEventListener('click', () => this.advanceEpoch());
    document.getElementById('modal-cancel').addEventListener('click', () => this.closeModal());
    this.els.modal.querySelector('.modal-backdrop').addEventListener('click', () => this.closeModal());

    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
        if (tab.dataset.tab === 'tree') this.renderEvolutionTree();
      });
    });
  }

  showScreen(name) {
    Object.values(this.screens).forEach(s => s.classList.remove('active'));
    this.screens[name].classList.add('active');
  }

  startGame() {
    this.sim.newWorld();
    this.showScreen('game');
    this.render();
  }

  advanceEpoch() {
    if (this.sim.ended) return;
    this.sim.advanceEpoch();
    this.render();
  }

  render() {
    const { world, life, decisions, ended } = this.sim.getState();
    if (!world) return;

    this.renderHeader(world, life);
    this.renderWorldStats(world);
    this.renderWorldCanvas(world, life);
    this.renderSpeciesList(life);
    this.renderEventLog(world);
    this.renderDecisions(decisions, world, life);
    this.els.btnAdvance.disabled = ended;
  }

  renderHeader(world, life) {
    this.els.worldName.textContent = world.name;
    this.els.epoch.textContent = `Epoch ${world.epoch}`;
    this.els.years.textContent = formatYears(world.years);
    this.els.speciesCount.textContent = life.getLiving().length;
    this.els.biodiversity.textContent = life.getBiodiversity();
    this.els.intelligencePeak.textContent = (life.getIntelligencePeak() * 100).toFixed(0) + '%';
  }

  renderWorldStats(world) {
    this.els.barTemp.style.width = clamp((world.temperature + 30) / 90 * 100, 0, 100) + '%';
    this.els.valTemp.textContent = world.temperature.toFixed(0) + '°C';
    this.els.barO2.style.width = clamp(world.o2 / 21 * 100, 0, 100) + '%';
    this.els.valO2.textContent = world.o2.toFixed(1) + '%';
    this.els.barWater.style.width = world.waterCoverage + '%';
    this.els.valWater.textContent = world.waterCoverage.toFixed(0) + '%';
    const tectLabel = world.tectonicActivity > 0.7 ? 'High' : world.tectonicActivity > 0.4 ? 'Med' : 'Low';
    this.els.barTectonic.style.width = (world.tectonicActivity * 100) + '%';
    this.els.valTectonic.textContent = tectLabel;
  }

  renderWorldCanvas(world, life) {
    const ctx = this.worldCtx;
    const size = this.worldCanvas.width;
    const cellSize = size / GRID_SIZE;

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = world.grid[y][x];
        ctx.fillStyle = world.getCellColor(cell);
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    // Draw species as dots on their biome regions
    const living = life.getLiving();
    for (const s of living) {
      const biomeCells = [];
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (world.grid[y][x].biome === s.biome) biomeCells.push({ x, y });
        }
      }
      if (biomeCells.length === 0) continue;

      const dotCount = Math.min(Math.ceil(s.population / 50000), 30);
      ctx.fillStyle = s.color;
      for (let i = 0; i < dotCount; i++) {
        const cell = biomeCells[Math.floor(Math.random() * biomeCells.length)];
        const px = cell.x * cellSize + cellSize / 2 + (Math.random() - 0.5) * cellSize;
        const py = cell.y * cellSize + cellSize / 2 + (Math.random() - 0.5) * cellSize;
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1.5, s.traits.size * 3), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  renderSpeciesList(life) {
    const living = life.getLiving().sort((a, b) => b.population - a.population);
    const extinct = life.extinct.slice(-5);

    if (living.length === 0 && extinct.length === 0) {
      this.els.speciesList.innerHTML = '<div class="empty-state">No life yet.<br>Use <strong>Comet Delivery</strong> or advance time to seed the oceans.</div>';
      return;
    }

    let html = living.map(s => this.speciesCardHTML(s)).join('');
    if (extinct.length > 0) {
      html += '<div style="margin:0.5rem 0;font-size:0.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;">Recently Extinct</div>';
      html += extinct.map(s => this.speciesCardHTML(s, true)).join('');
    }
    this.els.speciesList.innerHTML = html;
  }

  speciesCardHTML(s, extinct = false) {
    const topTraits = s.getTopTraits(3);
    const intPct = (s.traits.intelligence * 100).toFixed(0);
    const sapientClass = s.isSapient ? ' sapient' : '';
    const extinctClass = extinct || !s.alive ? ' extinct' : '';

    return `
      <div class="species-card${sapientClass}${extinctClass}">
        <div class="species-header">
          <span class="species-name"><span class="species-icon">${s.icon}</span> ${s.name}${s.isSapient ? ' ⭐' : ''}</span>
          <span class="species-pop">${formatNumber(s.population)}</span>
        </div>
        <div class="species-traits">
          ${topTraits.map(([k, v]) =>
            `<span class="trait-tag${k === 'intelligence' && v > 0.4 ? ' highlight' : ''}">${TRAIT_NAMES[k]}: ${(v * 100).toFixed(0)}%</span>`
          ).join('')}
          <span class="trait-tag">${s.biome}</span>
        </div>
        <div class="species-bar">
          <div class="species-bar-fill" style="width:${intPct}%;background:${s.color}"></div>
        </div>
      </div>`;
  }

  renderEventLog(world) {
    if (world.events.length === 0) {
      this.els.eventLog.innerHTML = '<div class="empty-state">Events will appear here as your world evolves.</div>';
      return;
    }

    this.els.eventLog.innerHTML = world.events.slice(0, 50).map(e => `
      <div class="event-entry ${e.type}">
        <div class="event-time">Epoch ${e.epoch} · ${formatYears(e.years)} years</div>
        ${e.message}
      </div>
    `).join('');
  }

  renderDecisions(decisions, world, life) {
    const available = decisions.getAvailableDecisions();
    this.els.decisionPoints.textContent = decisions.remainingPoints;

    this.els.decisionsList.innerHTML = available.map(d => {
      const canUse = decisions.canUse(d.id);
      const used = decisions.usedThisEpoch.includes(d.id);
      return `
        <div class="decision-card${canUse ? '' : ' disabled'}${used ? ' used' : ''}"
             data-decision="${d.id}">
          <div class="decision-icon">${d.icon}</div>
          <div class="decision-name">${d.name}${used ? ' ✓' : ''}</div>
          <div class="decision-desc">${d.desc}</div>
        </div>`;
    }).join('');

    this.els.decisionsList.querySelectorAll('.decision-card:not(.disabled)').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.decision;
        if (!decisions.canUse(id)) return;
        this.openDecision(id);
      });
    });
  }

  openDecision(decisionId) {
    const decision = DECISIONS.find(d => d.id === decisionId);
    if (!decision) return;

    if (decision.requiresModal && decision.getOptions) {
      const { world, life } = this.sim.getState();
      const options = decision.getOptions(world, life);
      if (!options || options.length === 0) return;

      this.pendingDecision = decisionId;
      this.els.modalTitle.textContent = decision.name;
      this.els.modalDesc.textContent = decision.desc;
      this.els.modalOptions.innerHTML = options.map(o => `
        <button class="modal-option" data-choice="${o.id}">
          <div class="option-label">${o.label}</div>
          <div class="option-desc">${o.desc}</div>
        </button>
      `).join('');

      this.els.modalOptions.querySelectorAll('.modal-option').forEach(btn => {
        btn.addEventListener('click', () => {
          this.executeDecision(decisionId, btn.dataset.choice);
          this.closeModal();
        });
      });

      this.els.modal.classList.remove('hidden');
    } else {
      this.executeDecision(decisionId);
    }
  }

  executeDecision(decisionId, choice = null) {
    const result = this.sim.applyDecision(decisionId, choice);
    if (result) {
      this.showToast(result.result, 'info');
    }
    this.render();
  }

  closeModal() {
    this.els.modal.classList.add('hidden');
    this.pendingDecision = null;
  }

  showEndScreen(endReason) {
    const { world, life } = this.sim.getState();

    this.els.endIcon.textContent = endReason.icon;
    this.els.endTitle.textContent = endReason.title;
    this.els.endDesc.textContent = endReason.desc;

    this.els.endStats.innerHTML = `
      <div class="end-stat">
        <div class="end-stat-value">${world.epoch}</div>
        <div class="end-stat-label">Epochs</div>
      </div>
      <div class="end-stat">
        <div class="end-stat-value">${formatYears(world.years)}</div>
        <div class="end-stat-label">Years</div>
      </div>
      <div class="end-stat">
        <div class="end-stat-value">${life.species.length}</div>
        <div class="end-stat-label">Total Species</div>
      </div>
      <div class="end-stat">
        <div class="end-stat-value">${life.getLiving().length}</div>
        <div class="end-stat-label">Surviving</div>
      </div>
      <div class="end-stat">
        <div class="end-stat-value">${life.totalSpeciations}</div>
        <div class="end-stat-label">Speciations</div>
      </div>
      <div class="end-stat">
        <div class="end-stat-value">${(life.getIntelligencePeak() * 100).toFixed(0)}%</div>
        <div class="end-stat-label">Peak Intelligence</div>
      </div>
    `;

    this.showScreen('end');
  }

  renderEvolutionTree() {
    const { life } = this.sim.getState();
    if (!life) return;

    const canvas = this.treeCanvas;
    const ctx = this.treeCtx;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#8896ab';
    ctx.font = '13px Inter, sans-serif';
    ctx.textAlign = 'center';

    const allSpecies = life.species;
    if (allSpecies.length === 0) {
      ctx.fillText('No species yet', w / 2, h / 2);
      return;
    }

    const maxGen = Math.max(...allSpecies.map(s => s.generation), 1);
    const nodes = allSpecies.map(s => ({
      species: s,
      x: 40 + (s.generation / maxGen) * (w - 80),
      y: 0,
    }));

    // Assign y positions by grouping
    const genGroups = {};
    for (const n of nodes) {
      const g = n.species.generation;
      if (!genGroups[g]) genGroups[g] = [];
      genGroups[g].push(n);
    }

    for (const [gen, group] of Object.entries(genGroups)) {
      const spacing = h / (group.length + 1);
      group.forEach((n, i) => { n.y = spacing * (i + 1); });
    }

    // Draw connections
    ctx.strokeStyle = '#2a3548';
    ctx.lineWidth = 1.5;
    for (const n of nodes) {
      if (n.species.parentId) {
        const parent = nodes.find(p => p.species.id === n.species.parentId);
        if (parent) {
          ctx.beginPath();
          ctx.moveTo(parent.x, parent.y);
          ctx.lineTo(n.x, n.y);
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    for (const n of nodes) {
      const s = n.species;
      const radius = s.alive ? 8 : 5;
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = s.alive ? s.color : '#444';
      ctx.fill();
      if (s.isSapient) {
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = s.alive ? '#e8edf5' : '#555';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(s.name, n.x, n.y + radius + 12);
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    this.els.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }
}
