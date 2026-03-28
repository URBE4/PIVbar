import { WebSocketClient } from './WebSocketClient.js';

export class NetworkSync {
    constructor() {
        this.client = new WebSocketClient('http://localhost:4000');
        this.isMultiplayer = false;
        this.isHost = false;
        this.players = [];
        this.pendingActions = [];
        this.lastSyncTime = 0;
        this.syncInterval = 100; // 100ms
    }

    async connect(userData) {
        try {
            await this.client.connect();
            this.client.joinRoom(userData.roomId, userData.username);
            this.isMultiplayer = true;
            return true;
        } catch (error) {
            console.error('Failed to connect:', error);
            return false;
        }
    }

    createRoom(roomData) {
        this.client.joinRoom(roomData.roomId, roomData.username);
        this.isHost = true;
        this.isMultiplayer = true;
    }

    joinRoom(roomId, username) {
        this.client.joinRoom(roomId, username);
        this.isHost = false;
        this.isMultiplayer = true;
    }

    setupGameCallbacks(game) {
        this.client.on('room:update', (data) => {
            if (data.players) {
                this.players = data.players;
                game.updatePlayerList?.(this.players);
            }
        });

        this.client.on('sync_state', (data) => {
            this.handleSync(data, game);
        });

        this.client.on('sync_actions', (actions) => {
            actions.forEach((a) => this.handleSync(a, game));
        });

        this.client.on('tower_built', (data) => {
            if (data.playerId !== this.client.playerId) {
                game.addRemoteTower?.(data);
            }
        });

        this.client.on('player_joined', (data) => {
            this.players = data.players || this.players;
            game.updatePlayerList?.(this.players);
        });

        this.client.on('player_left', (data) => {
            this.players = data.players || this.players;
            game.updatePlayerList?.(this.players);
        });

        this.client.on('game_started', (data) => {
            game.onGameStarted?.(data);
        });
    }

    handleSync(data, game) {
        if (!data) return;
        const now = Date.now();
        const latency = now - (data.timestamp || now);

        if (data.action === 'build_tower' && data.payload) {
            game.addRemoteTower?.(data.payload);
        } else if (data.action === 'upgrade_tower' && data.payload) {
            game.upgradeRemoteTower?.(data.payload);
        }

        this.lastSyncTime = now;
        game.onNetworkLatency?.(latency);
    }

    sendBuildTower(towerData, position) {
        if (this.isMultiplayer) {
            this.client.buildTower({ towerData }, position);
        }
    }

    sendGameAction(action, payload) {
        if (this.isMultiplayer) {
            this.client.gameAction(action, payload);
        }
    }

    startGame() {
        if (this.isHost) {
            this.client.startGame();
        }
    }

    leave() {
        this.client.leaveRoom();
        this.isMultiplayer = false;
        this.isHost = false;
    }

    isConnected() {
        return this.client.isConnected;
    }
}

window.NetworkSync = NetworkSync;
