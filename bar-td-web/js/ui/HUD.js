export class HUD {
  constructor(game) {
    this.game = game;
    this.lives = game.baseHp;
    this.notifContainer = document.getElementById('notifications');
  }

  update() {
    this.lives = this.game.baseHp;
    const metal = document.getElementById('metal-value');
    const energy = document.getElementById('energy-value');
    const wave = document.getElementById('wave-number');
    const lives = document.getElementById('lives-value');

    if (metal) metal.textContent = `${Math.floor(this.game.resourceManager.metal)}`;
    if (energy) energy.textContent = `${Math.floor(this.game.resourceManager.energy)}`;
    if (wave) wave.textContent = `${this.game.currentWave}`;
    if (lives) lives.textContent = `${this.lives}`;
  }

  showNotification(text) {
    if (!this.notifContainer) return;
    const el = document.createElement('div');
    el.className = 'notification';
    el.textContent = text;
    this.notifContainer.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  showTowerInfo(tower) {
    const infoPanel = document.getElementById('info-panel');
    const title = document.getElementById('info-title');
    const stats = document.getElementById('info-stats');

    if (!infoPanel || !title || !stats) return;
    infoPanel.classList.remove('hidden');
    title.textContent = `${tower.data.name} LVL ${tower.level}`;
    stats.innerHTML = `
      <p>Урон: ${tower.damage}</p>
      <p>Скорость: ${tower.fireRate}</p>
      <p>Диапазон: ${tower.range}</p>
    `;
  }

  updatePlayers(players) {
    const message = players && players.length ? `Игроков в комнате: ${players.length}` : 'Комната пуста';
    this.showNotification(message);
  }

  showGameOver(titleText, statsText) {
    const over = document.getElementById('game-over');
    const overTitle = document.getElementById('game-over-title');
    const overStats = document.getElementById('game-over-stats');
    const gameUi = document.getElementById('game-ui');

    if (!over || !overTitle || !overStats || !gameUi) return;
    gameUi.classList.add('hidden');
    over.classList.remove('hidden');

    overTitle.textContent = titleText;
    overStats.textContent = statsText;
  }
}
