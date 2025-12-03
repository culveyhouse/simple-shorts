export class UIOverlay {
  constructor({ version, seed, onRestart }) {
    this.seedEl = document.getElementById('seed');
    this.woodEl = document.getElementById('wood-count');
    this.stoneEl = document.getElementById('stone-count');
    this.cornEl = document.getElementById('corn-count');
    this.winEl = document.getElementById('win');
    this.restartBtn = document.getElementById('restart');
    this.seedEl.textContent = `${version} • Seed: ${seed}`;
    this.restartBtn.addEventListener('click', onRestart);
  }

  updateCounts(counters) {
    this.woodEl.textContent = counters.wood;
    this.stoneEl.textContent = counters.stone;
    this.cornEl.textContent = counters.corn;
  }

  showWin() {
    this.winEl.style.display = 'block';
  }
}
