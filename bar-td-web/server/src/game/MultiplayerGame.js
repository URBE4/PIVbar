import { SyncManager } from './SyncManager.js';

export class MultiplayerGame {
  constructor(roomId, hostId, config = { maxPlayers: 4 }, syncManager = null) {
    this.roomId = roomId;
    this.hostId = hostId;
    this.config = config;
    this.players = new Map();
    this.gameState = 'lobby';
    this.currentWave = 0;
    this.syncManager = syncManager || new SyncManager();

    this.addPlayer(hostId, 'Host');
  }

  setSyncManager(syncManager) {
    this.syncManager = syncManager;
  }

  addPlayer(playerId, username) {
    if (this.isFull()) return false;

    this.players.set(playerId, {
      id: playerId,
      username: username || `Player_${playerId}`,
      resources: { metal: 500, energy: 1000 },
      towers: [],
      isReady: false,
      score: 0
    });

    this.syncManager.broadcastState(this.roomId, this.getGameState());
    return true;
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    if (playerId === this.hostId) {
      const nextHost = this.players.keys().next();
      if (!nextHost.done) {
        this.hostId = nextHost.value;
      }
    }
    this.syncManager.broadcastState(this.roomId, this.getGameState());
  }

  hasPlayer(playerId) {
    return this.players.has(playerId);
  }

  isFull() {
    return this.players.size >= this.config.maxPlayers;
  }

  isHost(playerId) {
    return playerId === this.hostId;
  }

  getPlayerCount() {
    return this.players.size;
  }

  getPlayers() {
    return Array.from(this.players.values());
  }

  setPlayerReady(playerId, isReady) {
    const player = this.players.get(playerId);
    if (!player) return;
    player.isReady = !!isReady;
    this.syncManager.broadcastState(this.roomId, this.getGameState());
  }

  canStart() {
    if (this.players.size === 0) return false;
    return Array.from(this.players.values()).every((p) => p.isReady);
  }

  start() {
    if (!this.canStart()) return false;

    this.gameState = 'playing';
    this.currentWave = 1;
    this.syncManager.broadcastState(this.roomId, this.getGameState());
    return true;
  }

  handleAction(playerId, action, payload) {
    switch (action) {
      case 'build_tower':
        this.handleBuildTower(playerId, payload);
        break;
      case 'upgrade_tower':
        this.handleUpgradeTower(playerId, payload);
        break;
      case 'sell_tower':
        this.handleSellTower(playerId, payload);
        break;
      case 'use_ability':
        this.handleUseAbility(playerId, payload);
        break;
      case 'player_ready':
        this.setPlayerReady(playerId, payload.ready);
        break;
      default:
        console.warn('Unknown action', action);
    }
  }

  handleBuildTower(playerId, payload) {
    const player = this.players.get(playerId);
    if (!player) return;

    const towerCost = payload.towerData.cost || { metal: 0, energy: 0 };
    if (player.resources.metal >= towerCost.metal && player.resources.energy >= towerCost.energy) {
      player.resources.metal -= towerCost.metal;
      player.resources.energy -= towerCost.energy;

      player.towers.push({
        ...payload.towerData,
        position: payload.position,
        ownerId: playerId,
        id: `tower_${Date.now()}_${playerId}`
      });

      this.syncManager.broadcastState(this.roomId, this.getGameState());
    }
  }

  handleUpgradeTower(playerId, payload) {
    const player = this.players.get(playerId);
    if (!player) return;

    const tower = player.towers.find((t) => t.id === payload.towerId);
    if (tower && player.resources.metal >= payload.upgradeCost) {
      player.resources.metal -= payload.upgradeCost;
      tower.level = (tower.level || 1) + 1;
      tower.damage = (tower.damage || 1) * 1.3;
      this.syncManager.broadcastState(this.roomId, this.getGameState());
    }
  }

  handleSellTower(playerId, payload) {
    const player = this.players.get(playerId);
    if (!player) return;

    const towerIndex = player.towers.findIndex((t) => t.id === payload.towerId);
    if (towerIndex !== -1) {
      const tower = player.towers[towerIndex];
      const refund = (tower.cost?.metal || 0) * 0.5;
      player.resources.metal += refund;
      player.towers.splice(towerIndex, 1);
      this.syncManager.broadcastState(this.roomId, this.getGameState());
    }
  }

  handleUseAbility(playerId, payload) {
    this.syncManager.broadcastAction(this.roomId, 'ability_used', {
      playerId,
      ability: payload.ability,
      position: payload.position
    });
  }

  advanceWave() {
    this.currentWave += 1;
    this.syncManager.broadcastState(this.roomId, this.getGameState());
  }

  getGameState() {
    return {
      roomId: this.roomId,
      gameState: this.gameState,
      currentWave: this.currentWave,
      players: this.getPlayers(),
      timestamp: Date.now()
    };
  }

  endGame(victory) {
    this.gameState = 'ended';

    const finalState = {
      ...this.getGameState(),
      victory,
      ended: true
    };

    this.syncManager.broadcastState(this.roomId, finalState);

    // TODO: push player stats to DB via отдельный сервис/репозиторий
  }
}
