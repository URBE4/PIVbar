import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { SyncManager } from './src/game/SyncManager.js';
import { MultiplayerGame } from './src/game/MultiplayerGame.js';
import { initializeAPI } from './src/api.js';
import { connectDatabase } from './src/database.js';

const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const roomMap = new Map();
const syncManager = new SyncManager(io);

io.on('connection', (socket) => {
  console.log('socket connected:', socket.id);

  socket.on('room:join', ({ roomId, username }, callback) => {
    let game = roomMap.get(roomId);
    if (!game) {
      game = new MultiplayerGame(roomId, socket.id, { maxPlayers: 4 }, syncManager);
      roomMap.set(roomId, game);
    }

    if (!game.hasPlayer(socket.id) && game.isFull()) {
      callback?.({ error: 'room_full' });
      return;
    }

    game.addPlayer(socket.id, username);
    socket.join(roomId);
    socket.emit('room:update', game.getGameState());
    io.to(roomId).emit('room:players', game.getPlayers());
    callback?.({ success: true, state: game.getGameState() });
  });

  socket.on('room:start', ({ roomId }, callback) => {
    const game = roomMap.get(roomId);
    if (!game) {
      callback?.({ error: 'room_not_found' });
      return;
    }
    if (!game.isHost(socket.id)) {
      callback?.({ error: 'not_host' });
      return;
    }
    const started = game.start();
    callback?.(started ? { success: true } : { error: 'not_all_ready' });
  });

  socket.on('game:action', ({ roomId, action, payload }) => {
    const game = roomMap.get(roomId);
    if (!game) return;
    game.handleAction(socket.id, action, payload);
  });

  socket.on('room:set_ready', ({ roomId, ready }) => {
    const game = roomMap.get(roomId);
    if (!game) return;
    game.setPlayerReady(socket.id, ready);
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;
      const game = roomMap.get(roomId);
      if (!game) continue;
      game.removePlayer(socket.id);
      io.to(roomId).emit('room:players', game.getPlayers());

      if (game.getPlayerCount() === 0) {
        roomMap.delete(roomId);
      }
    }
  });
});

// Тикер синхронизации: периодически рассылать состояние и батчи действий
setInterval(() => {
  for (const [roomId, game] of roomMap.entries()) {
    game.syncManager.flush(roomId);
  }
}, 1000 / 60);

const startServer = async () => {
  const db = await connectDatabase();
  initializeAPI(app, db, io);

  const PORT = process.env.PORT || 4000;
  server.listen(PORT, () => {
    console.log(`TD multiplayer server running on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
