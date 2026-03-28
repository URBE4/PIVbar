import Phaser from 'phaser';
import { LevelManager } from './levels/LevelManager';

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
    this.levelManager = new LevelManager();
  }

  async create() {
    this.add.text(16, 16, 'BAR Tower Defense: старт', { fontSize: '32px', fill: '#ffffff' });

    try {
      const { level, mapData } = await this.levelManager.loadLevel(0);
      console.log('Loaded level', level.id, mapData);
      this.renderMap(mapData);
    } catch (error) {
      console.error('Не удалось загрузить уровень', error);
    }
  }

  renderMap(mapData) {
    const mapContainer = document.getElementById('game-container');
    if (!mapContainer) return;

    // Очищаем предыдущие тайлы
    mapContainer.innerHTML = '';
    mapContainer.classList.add('map-container');

    const tileSize = 32;
    mapData.tiles.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        const tile = document.createElement('div');
        tile.className = 'tile';
        if (cell === '1') tile.classList.add('wall');
        else tile.classList.add('path');

        if (mapData.spawn.x === x && mapData.spawn.y === y) tile.classList.add('spawn');
        if (mapData.goal.x === x && mapData.goal.y === y) tile.classList.add('goal');

        tile.style.left = `${x * tileSize}px`;
        tile.style.top = `${y * tileSize}px`;
        mapContainer.appendChild(tile);
      });
    });
  }

  update() {
    // TODO: здесь минимум логики TD (волны, враги, башни)
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  backgroundColor: '#1d1d2b',
  parent: 'game-container',
  scene: [MainScene],
};

new Phaser.Game(config);
