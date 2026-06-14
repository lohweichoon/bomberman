import { createServer } from 'http';
import { Server } from 'socket.io';
import {
  createInitialState, addPlayer, removePlayer, handleInput, processTick, startGame,
} from '../lib/game/logic';
import { TICK_INTERVAL_MS } from '../lib/game/constants';
import { GameState, PlayerKeys } from '../lib/game/types';

const httpServer = createServer((req, res) => {
  res.writeHead(200);
  res.end('Bomberman game server running');
});

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

interface Room {
  state: GameState;
  interval: ReturnType<typeof setInterval> | null;
}

const rooms = new Map<string, Room>();

function getRoom(roomId: string): Room {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { state: createInitialState(), interval: null });
  }
  return rooms.get(roomId)!;
}

function startLoop(roomId: string) {
  const room = rooms.get(roomId);
  if (!room || room.interval) return;
  room.interval = setInterval(() => {
    processTick(room.state);
    io.to(roomId).emit('tick', room.state);
    if (room.state.phase === 'gameover') stopLoop(roomId);
  }, TICK_INTERVAL_MS);
}

function stopLoop(roomId: string) {
  const room = rooms.get(roomId);
  if (room?.interval) {
    clearInterval(room.interval);
    room.interval = null;
  }
}

io.on('connection', (socket) => {
  const roomId = (socket.handshake.query.room as string) || '';
  if (!roomId) { socket.disconnect(); return; }

  const room = getRoom(roomId);

  if (Object.keys(room.state.players).length >= 4) {
    socket.emit('full');
    socket.disconnect();
    return;
  }

  addPlayer(room.state, socket.id);
  socket.join(roomId);
  socket.emit('joined', { playerId: socket.id, state: room.state });
  socket.to(roomId).emit('state', room.state);

  socket.on('setName', (name: string) => {
    const p = room.state.players[socket.id];
    if (p) p.name = String(name).slice(0, 16);
    io.to(roomId).emit('state', room.state);
  });

  socket.on('setMaxLives', (lives: number) => {
    if (socket.id !== room.state.hostId || room.state.phase !== 'lobby') return;
    room.state.maxLives = Math.max(1, Math.min(5, Number(lives)));
    for (const p of Object.values(room.state.players)) p.lives = room.state.maxLives;
    io.to(roomId).emit('state', room.state);
  });

  socket.on('startGame', () => {
    if (socket.id !== room.state.hostId || room.state.phase !== 'lobby') return;
    startGame(room.state);
    io.to(roomId).emit('state', room.state);
    startLoop(roomId);
  });

  socket.on('input', (keys: PlayerKeys) => {
    handleInput(room.state, socket.id, keys);
  });

  socket.on('restartGame', () => {
    if (socket.id !== room.state.hostId || room.state.phase !== 'gameover') return;
    stopLoop(roomId);
    const names: Record<string, string> = {};
    for (const [id, p] of Object.entries(room.state.players)) names[id] = p.name;
    const newState = createInitialState();
    for (const id of Object.keys(room.state.players)) {
      addPlayer(newState, id);
      if (newState.players[id] && names[id]) newState.players[id].name = names[id];
    }
    room.state = newState;
    io.to(roomId).emit('state', room.state);
  });

  socket.on('disconnect', () => {
    const r = rooms.get(roomId);
    if (!r) return;
    removePlayer(r.state, socket.id);
    if (Object.keys(r.state.players).length === 0) {
      stopLoop(roomId);
      rooms.delete(roomId);
    } else {
      io.to(roomId).emit('state', r.state);
    }
  });
});

const PORT = parseInt(process.env.PORT || '3001');
httpServer.listen(PORT, () => console.log(`Game server on port ${PORT}`));
