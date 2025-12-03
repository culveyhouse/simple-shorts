export class UIOverlay {
  constructor({ seed, onRestart }) {
    this.seedEl = document.getElementById('seed');
    this.woodEl = document.getElementById('wood-count');
    this.stoneEl = document.getElementById('stone-count');
    this.cornEl = document.getElementById('corn-count');
    this.messageEl = document.getElementById('message');
    this.winEl = document.getElementById('win');
    this.restartBtn = document.getElementById('restart');
    this.seedEl.textContent = `Seed: ${seed}`;
    this.restartBtn.addEventListener('click', onRestart);
    this.compassText = 'Explore to find resources';
  }

  updateCounts(counters) {
    this.woodEl.textContent = counters.wood;
    this.stoneEl.textContent = counters.stone;
    this.cornEl.textContent = counters.corn;
  }

  setCompass(text) {
    this.compassText = text;
    this.messageEl.textContent = text;
  }

  showWin() {
    this.winEl.style.display = 'block';
  }
}
