export class SyncManager {
  constructor(io = null) {
    this.io = io;
    this.stateBuffer = null;
    this.pendingActions = [];
    this.tickRate = 60;
    this.lastTick = 0;
  }

  setIo(io) {
    this.io = io;
  }

  broadcastState(state) {
    this.stateBuffer = state;
  }

  broadcastAction(action, payload) {
    this.pendingActions.push({ action, payload, timestamp: Date.now() });
  }

  shouldTick() {
    const now = Date.now();
    if (now - this.lastTick >= 1000 / this.tickRate) {
      this.lastTick = now;
      return true;
    }
    return false;
  }

  getSnapshot() {
    return {
      state: this.stateBuffer,
      actions: [...this.pendingActions],
      timestamp: Date.now()
    };
  }

  reset() {
    this.stateBuffer = null;
    this.pendingActions = [];
  }

  flush(roomId) {
    if (!this.io || !roomId || !this.shouldTick()) return;

    const snapshot = this.getSnapshot();

    if (snapshot.state) {
      this.io.to(roomId).emit('sync_state', snapshot.state);
    }

    if (snapshot.actions.length > 0) {
      this.io.to(roomId).emit('sync_actions', snapshot.actions);
    }

    this.reset();
  }
}

