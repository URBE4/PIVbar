import { levelManager } from '../levels/LevelManager.js';
import { MapRenderer } from '../levels/MapRenderer.js';
import { ResourceManager } from './ResourceManager.js';
import { Tower } from '../gameplay/Tower.js';
import { Particle } from '../gameplay/Particle.js';
import { TowerSpriteRenderer } from '../graphics/TowerSpriteRenderer.js';
import { WaveManager } from '../gameplay/WaveManager.js';
import { Pathfinding } from '../gameplay/Pathfinding.js';
import { HUD } from '../ui/HUD.js';
import { NetworkSync } from './NetworkSync.js';
import { ClanUI } from '../ui/ClanUI.js';
import { LeaderboardUI } from '../ui/LeaderboardUI.js';
import { SaveSystem } from './SaveSystem.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Загрузка уровня 1
        this.level = levelManager.loadLevel(1);

        // Инициализация базовой жизни
        this.baseHp = this.level.baseHp || 20;

        this.resize();
        this.mapRenderer = new MapRenderer(this.canvas, this.level);
        this.towerSpriteRenderer = new TowerSpriteRenderer();

        this.resourceManager = new ResourceManager();
        this.pathfinding = new Pathfinding(this.level.mapWidth, this.level.mapHeight);
        this.waveManager = new WaveManager(this);
        this.hud = new HUD(this);
        this.networkSync = new NetworkSync();
        this.clanUI = new ClanUI(this.networkSync);
        this.leaderboardUI = new LeaderboardUI();

        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];
        this.currentWave = 1;
        this.players = [];
        this.isMultiplayer = false;

        this.selectedTower = null;
        this.selectedSpot = null;
        this.selectedTile = null;

        this.hoverX = null;
        this.hoverY = null;

        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;

        this.bindEvents();
    }

  setupNetwork() {
    if (!this.networkSync) return;
    this.networkSync.connect({ roomId: this.roomId, username: this.username }).then(() => {
      console.log('Network connected');
      this.networkSync.setupGameCallbacks(this);
    }).catch((error) => {
      console.warn('Network connect failed', error);
    });
  }

  resize() {
    if (!this.level) return;
    this.canvas.width = this.level.mapWidth;
    this.canvas.height = this.level.mapHeight;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    if (this.canvas) {
      this.canvas.addEventListener('click', (e) => this.handleClick(e));
      this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }

    const btnPause = document.getElementById('btn-pause');
    if (btnPause) btnPause.addEventListener('click', () => this.togglePause());
    
    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) btnRestart.addEventListener('click', () => this.restart());
    
    const btnMenu = document.getElementById('btn-menu');
    if (btnMenu) btnMenu.addEventListener('click', () => this.toMenu());
    
    const btnSell = document.getElementById('btn-sell');
    if (btnSell) btnSell.addEventListener('click', () => this.sellTower());
    
    const btnUpgrade = document.getElementById('btn-upgrade');
    if (btnUpgrade) btnUpgrade.addEventListener('click', () => this.upgradeTower());

    const towerList = document.getElementById('tower-list');
    if (towerList && typeof TOWER_TYPES !== 'undefined') {
      towerList.innerHTML = '';
      Object.keys(TOWER_TYPES).forEach((key) => {
        const type = TOWER_TYPES[key];
        const item = document.createElement('div');
        item.className = 'tower-item';
        item.textContent = `${type.name} - ${type.cost.metal} ⚙️/${type.cost.energy} ⚡`;
        item.addEventListener('click', () => {
          this.selectedTower = key;
          document.querySelectorAll('.tower-item').forEach((el) => el.classList.remove('selected'));
          item.classList.add('selected');
          this.hud.showNotification(`Выбрана башня: ${type.name}`);
        });
        towerList.appendChild(item);
      });
    }
  }

  start() {
    console.log('🎮 Game starting...', { canvas: !!this.canvas, level: !!this.level, mapRenderer: !!this.mapRenderer });
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.resourceManager.reset();
    if (this.waveManager) this.waveManager.start();
    if (this.hud) this.hud.update();
    console.log('✅ Game loop initiating...');
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  gameLoop(currentTime) {
    if (!this.isRunning) return;
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (!this.isPaused) {
      this.update(deltaTime);
      this.render();
    }

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(deltaTime) {
    this.resourceManager.update(deltaTime);
    this.waveManager.update(deltaTime);

    this.towers.forEach((tower) => tower.update(deltaTime, this.enemies, this.projectiles));

    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      enemy.update(deltaTime, this);
      if (enemy.reachedBase) {
        this.enemyReachedBase(enemy);
        this.enemies.splice(i, 1);
      } else if (enemy.health <= 0 || enemy.dead) {
        this.enemyKilled(enemy);
        this.enemies.splice(i, 1);
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const proj = this.projectiles[i];
      proj.update(deltaTime);
      if (proj.isDead) this.projectiles.splice(i, 1);
    }

    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const p = this.particles[i];
      p.update(deltaTime);
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    this.hud.update();
  }

  render() {
    if (!this.canvas || !this.ctx) {
      console.error('Canvas or context not initialized');
      return;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Рендерить карту уровня
    if (this.mapRenderer && this.level) {
      this.mapRenderer.render();
    } else {
      console.warn('MapRenderer or Level missing:', { mapRenderer: !!this.mapRenderer, level: !!this.level });
    }
    
    // Рендерить башни со спрайтами
    this.towers.forEach((tower) => {
      this.towerSpriteRenderer.renderTower(this.ctx, tower);
    });
    
    this.enemies.forEach((enemy) => enemy.render(this.ctx));
    this.projectiles.forEach((proj) => proj.render(this.ctx));
    this.particles.forEach((p) => p.render(this.ctx));
    if (this.selectedTile) this.renderPlacementPreview();
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const tile = this.pathfinding.getTile(x, y);

    if (this.selectedTower) {
      this.placeTower(tile);
    } else if (tile) {
      this.selectTile(tile);
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  }

  placeTower(tile) {
    if (!tile || !this.selectedTower) return;
    const towerData = TOWER_TYPES[this.selectedTower];
    const cost = towerData.cost;

    if (this.resourceManager.canAfford(cost.metal, cost.energy)) {
      if (this.pathfinding.canBuild(tile)) {
        this.resourceManager.spend(cost.metal, cost.energy);
        const tower = new Tower(tile.x * 40 + 20, tile.y * 40 + 20, this.selectedTower, towerData);
        this.towers.push(tower);
        this.selectedTower = null;
        this.hud.showNotification(`🏗️ Построено: ${towerData.name}`);
        SaveSystem.addTowerBuilt();

        if (this.network && this.network.roomId) {
          this.network.sendGameAction(this.network.roomId, 'build_tower', {
            towerData,
            position: { x: tile.x, y: tile.y }
          });
        }
      }
    } else {
      this.hud.showNotification('❌ Недостаточно ресурсов!');
    }
  }

  selectTile(tile) {
    const tower = this.towers.find((t) => Math.abs(t.x - tile.x * 40 - 20) < 20 && Math.abs(t.y - tile.y * 40 - 20) < 20);
    if (tower) {
      this.selectedTile = tile;
      this.hud.showTowerInfo(tower);
    }
  }

  enemyKilled(enemy) {
    this.resourceManager.addMetal(enemy.reward || 5);
    SaveSystem.addKill();
    this.spawnParticles(enemy.x, enemy.y, '#e94560');
  }

  enemyReachedBase(enemy) {
    this.hud.lives -= 1;
    this.gameOverCheck();
    this.spawnParticles(enemy.x, enemy.y, '#ff0000');
  }

  gameOverCheck() {
    if (this.hud.lives <= 0) {
      this.gameOver(false);
    }
  }

  spawnParticles(x, y, color) {
    for (let i = 0; i < 10; i += 1) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  async startMultiplayer(userData) {
    const connected = await this.networkSync.connect(userData);

    if (connected) {
      this.isMultiplayer = true;
      this.networkSync.setupGameCallbacks(this);
      await this.clanUI.loadClanInfo(userData.userId);
      await this.leaderboardUI.loadLeaderboard();
    }
  }

  onGameStarted(data) {
    if (!data) return;
    this.currentWave = data.wave || 1;
    this.players = data.players || [];
    this.hud.showNotification('Мультиплеер запущен');
  }

  addRemoteTower(data) {
    const tower = new Tower(
      data.position.x,
      data.position.y,
      data.towerData.type,
      data.towerData
    );
    tower.ownerId = data.playerId;
    this.towers.push(tower);
  }

  updatePlayerList(players) {
    this.players = players;
    this.hud.updatePlayerList?.(players);
  }

  onRoomUpdate(data) {
    if (!data) return;
    this.hud.showNotification(`Комната обновлена: ${data.roomId}`);
    if (data.players) {
      this.updatePlayerList(data.players);
    }
    if (this.networkSync) {
      this.networkSync.client.roomId = data.roomId;
    }
  }

  applyRemoteState(state) {
    if (!state || state.roomId !== this.network.roomId) return;
    this.hud.showNotification(`Состояние синхронизировано: волна ${state.currentWave}`);
    // TODO: применять игровые объекты (башни/энемис) в локальном представлении
  }

  applyRemoteActions(actions) {
    if (!Array.isArray(actions)) return;
    actions.forEach((action) => {
      if (action.action === 'ability_used') {
        this.hud.showNotification(`Игрок ${action.payload.playerId} использовал ${action.payload.ability}`);
      }
    });
  }

  togglePause() {
    this.isPaused = !this.isPaused;
  }

  async saveGameResult(victory) {
    const userId = localStorage.getItem('userId');
    const result = {
      userId,
      wave: this.hud.wave || this.currentWave || 1,
      score: this.calculateScore(),
      kills: this.totalKills || 0,
      victory
    };

    try {
      await fetch('/api/game/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result)
      });
    } catch (error) {
      console.error('Failed to save game result:', error);
    }
  }

  calculateScore() {
    return ((this.hud.wave || this.currentWave || 1) * 100) + ((this.totalKills || 0) * 10) + ((this.hud.lives || 0) * 50);
  }

  async gameOver(victory) {
    this.isRunning = false;
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('game-ui').classList.add('hidden');

    const title = document.getElementById('game-over-title');
    title.textContent = victory ? '🏆 Победа!' : '💀 Поражение';
    title.style.color = victory ? '#4ade80' : '#ef4444';

    SaveSystem.saveGame(this.currentWave, this.resourceManager);

    if (this.isMultiplayer) {
      await this.saveGameResult(victory);
    }
  }

  restart() {
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');

    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.particles = [];

    this.start();
  }

  toMenu() {
    this.isRunning = false;
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('game-ui').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
  }

  loadGameSettings() {
    const settings = SaveSystem.loadSettings();
    if (settings && settings.defaultMetal) this.resourceManager.metal = settings.defaultMetal;
  }

  loadSave() {
    const saved = SaveSystem.loadGame();
    if (!saved) return;
    this.currentWave = saved.wave || 1;
    this.resourceManager.metal = saved.metal || this.resourceManager.metal;
    this.resourceManager.energy = saved.energy || this.resourceManager.energy;
    this.hud.update();
  }

  renderPlacementPreview() {
    if (!this.selectedTile) return;
    this.ctx.fillStyle = 'rgba(0, 255, 0, 0.25)';
    this.ctx.fillRect(this.selectedTile.x * 40, this.selectedTile.y * 40, 40, 40);
  }

  sellTower() {
    if (!this.selectedTile) return;
    const index = this.towers.findIndex((t) => Math.abs(t.x - this.selectedTile.x * 40 - 20) < 20 && Math.abs(t.y - this.selectedTile.y * 40 - 20) < 20);
    if (index !== -1) {
      const tower = this.towers[index];
      this.resourceManager.addMetal(Math.floor(tower.data.cost.metal * 0.5));
      this.towers.splice(index, 1);
      this.selectedTile = null;
      document.getElementById('info-panel').classList.add('hidden');
    }
  }

  upgradeTower() {
    if (!this.selectedTile) return;
    const tower = this.towers.find((t) => Math.abs(t.x - this.selectedTile.x * 40 - 20) < 20 && Math.abs(t.y - this.selectedTile.y * 40 - 20) < 20);
    if (!tower) return;

    const upgradeCost = { metal: Math.floor(tower.data.cost.metal * 0.6), energy: Math.floor(tower.data.cost.energy * 0.6) };
    if (!this.resourceManager.canAfford(upgradeCost.metal, upgradeCost.energy)) {
      this.hud.showNotification('❌ Недостаточно ресурсов для апгрейда!');
      return;
    }

    this.resourceManager.spend(upgradeCost.metal, upgradeCost.energy);
    tower.level += 1;
    tower.damage = Math.round(tower.damage * 1.25);
    tower.fireRate = Math.min(3, tower.fireRate * 1.1);
    this.hud.showNotification(`🔧 Башня улучшена до ${tower.level} уровня`);
    this.hud.showTowerInfo(tower);
  }
}

window.game = null;

const btnNewGame = document.getElementById('btn-new-game');
if (btnNewGame) {
  btnNewGame.addEventListener('click', () => {
    const mainMenu = document.getElementById('main-menu');
    const gameUI = document.getElementById('game-ui');
    if (mainMenu) mainMenu.classList.add('hidden');
    if (gameUI) gameUI.classList.remove('hidden');
    window.game = new Game();
    window.game.start();
  });
}

const btnContinue = document.getElementById('btn-continue');
if (btnContinue) {
  btnContinue.addEventListener('click', () => {
    if (typeof SaveSystem !== 'undefined' && SaveSystem.hasSave()) {
      const mainMenu = document.getElementById('main-menu');
      const gameUI = document.getElementById('game-ui');
      if (mainMenu) mainMenu.classList.add('hidden');
      if (gameUI) gameUI.classList.remove('hidden');
      window.game = new Game();
      window.game.loadSave();
      window.game.start();
    }
  });
}

const btnCreateRoom = document.getElementById('btn-create-room');
if (btnCreateRoom) {
  btnCreateRoom.addEventListener('click', () => {
    const username = document.getElementById('network-username').value.trim() || 'Guest';
    const roomId = `room_${Date.now()}`;

    const mainMenu = document.getElementById('main-menu');
    const gameUI = document.getElementById('game-ui');
    if (mainMenu) mainMenu.classList.add('hidden');
    if (gameUI) gameUI.classList.remove('hidden');

    window.game = new Game();
    window.game.roomId = roomId;
    window.game.username = username;
    if (window.game.hud) {
      window.game.hud.showNotification(`Комната создана: ${roomId}`);
    }
    window.game.start();
  });
}

const btnJoinRoom = document.getElementById('btn-join-room');
if (btnJoinRoom) {
  btnJoinRoom.addEventListener('click', () => {
    const username = document.getElementById('network-username').value.trim() || 'Guest';
    const roomId = document.getElementById('network-room-id').value.trim();
    if (!roomId) {
      alert('Введите ID комнаты');
      return;
    }

    const mainMenu = document.getElementById('main-menu');
    const gameUI = document.getElementById('game-ui');
    if (mainMenu) mainMenu.classList.add('hidden');
    if (gameUI) gameUI.classList.remove('hidden');

    window.game = new Game();
    window.game.roomId = roomId;
    window.game.username = username;
    if (window.game.hud) {
      window.game.hud.showNotification(`Подключение к комнате: ${roomId}`);
    }
    window.game.start();
  });
}
