import { io } from 'socket.io-client';

export class WebSocketClient {
    constructor(serverUrl) {
        this.serverUrl = serverUrl;
        this.socket = null;
        this.isConnected = false;
        this.playerId = null;
        this.roomId = null;
        this.eventHandlers = new Map();
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.socket = io(this.serverUrl, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5
            });

            this.socket.on('connect', () => {
                console.log('✅ Connected to server');
                this.isConnected = true;
                this.playerId = this.socket.id;
                resolve(this.playerId);
            });

            this.socket.on('disconnect', () => {
                console.log('❌ Disconnected from server');
                this.isConnected = false;
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                reject(error);
            });

            this.setupEventListeners();
        });
    }

    setupEventListeners() {
        this.on('room:update', (data) => this.handleEvent('room:update', data));
        this.on('room:players', (data) => this.handleEvent('room:players', data));
        this.on('sync_state', (data) => this.handleEvent('sync_state', data));
        this.on('sync_actions', (data) => this.handleEvent('sync_actions', data));
        this.on('error', (data) => this.handleEvent('error', data));

        // дополнительные события
        this.on('room_full', (data) => this.handleEvent('room_full', data));
        this.on('not_host', (data) => this.handleEvent('not_host', data));
    }

    on(event, callback) {
        this.eventHandlers.set(event, callback);
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event) {
        this.eventHandlers.delete(event);
        if (this.socket) {
            this.socket.off(event);
        }
    }

    handleEvent(event, data) {
        console.log(`📨 Received: ${event}`, data);
        // хук для внешней логики
        const handler = this.eventHandlers.get(event);
        if (handler && event.startsWith('room') === false && event.startsWith('sync') === false) {
            handler(data);
        }
    }

    emit(event, data) {
        if (this.socket && this.isConnected) {
            this.socket.emit(event, data);
        }
    }

    joinRoom(roomId, username) {
        this.roomId = roomId;
        this.emit('room:join', { roomId, username });
    }

    setReady(roomId, ready) {
        this.emit('room:set_ready', { roomId, ready });
    }

    startGame(roomId) {
        this.emit('room:start', { roomId });
    }

    sendGameAction(roomId, action, payload = {}) {
        this.emit('game:action', { roomId, action, payload });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
    }
}
