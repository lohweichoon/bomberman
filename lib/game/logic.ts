import {
  GameState, Player, Bomb, Powerup, PowerupType, PlayerKeys,
} from './types';
import {
  MAP_WIDTH, MAP_HEIGHT, BOMB_TIMER_TICKS, EXPLOSION_DURATION_TICKS,
  RESPAWN_TIMER_TICKS, INVINCIBLE_TICKS, COUNTDOWN_TICKS,
  PLAYER_COLORS, SPAWN_POSITIONS, TICK_RATE, SPAWN_CLEAR,
} from './constants';
import { generateMap } from './map';

let _id = 0;
const uid = () => String(++_id);

export function createInitialState(): GameState {
  return {
    phase: 'lobby',
    map: [],
    players: {},
    bombs: [],
    explosions: [],
    powerups: [],
    countdown: 0,
    winner: null,
    hostId: '',
    maxLives: 3,
    tick: 0,
  };
}

export function addPlayer(state: GameState, playerId: string) {
  const count = Object.keys(state.players).length;
  if (count >= 4) return false;

  const colorIndex = count;
  const spawn = SPAWN_POSITIONS[colorIndex];

  state.players[playerId] = {
    id: playerId,
    name: `Player ${count + 1}`,
    color: PLAYER_COLORS[colorIndex],
    colorIndex,
    tileX: spawn.x,
    tileY: spawn.y,
    moveProgress: 0,
    moveDirX: 0,
    moveDirY: 0,
    isMoving: false,
    lives: state.maxLives,
    bombCount: 1,
    activeBombs: 0,
    blastRadius: 1,
    speed: 1,
    alive: true,
    respawnTimer: 0,
    invincible: 0,
    keys: { up: false, down: false, left: false, right: false, bomb: false },
    lastBombKey: false,
  };

  if (!state.hostId) state.hostId = playerId;
  return true;
}

export function removePlayer(state: GameState, playerId: string) {
  delete state.players[playerId];
  if (state.hostId === playerId) {
    const ids = Object.keys(state.players);
    state.hostId = ids.length > 0 ? ids[0] : '';
  }
}

export function handleInput(state: GameState, playerId: string, keys: PlayerKeys) {
  const player = state.players[playerId];
  if (player) player.keys = keys;
}

export function startGame(state: GameState) {
  state.map = generateMap(Date.now() & 0xffff);
  state.bombs = [];
  state.explosions = [];
  state.powerups = [];
  state.winner = null;
  state.countdown = COUNTDOWN_TICKS;
  state.phase = 'countdown';

  for (const player of Object.values(state.players)) {
    const spawn = SPAWN_POSITIONS[player.colorIndex];
    player.tileX = spawn.x;
    player.tileY = spawn.y;
    player.moveProgress = 0;
    player.moveDirX = 0;
    player.moveDirY = 0;
    player.isMoving = false;
    player.lives = state.maxLives;
    player.bombCount = 1;
    player.activeBombs = 0;
    player.blastRadius = 1;
    player.speed = 1;
    player.alive = true;
    player.respawnTimer = 0;
    player.invincible = 0;
    player.keys = { up: false, down: false, left: false, right: false, bomb: false };
    player.lastBombKey = false;
  }
}

export function processTick(state: GameState) {
  state.tick++;

  if (state.phase === 'countdown') {
    state.countdown--;
    if (state.countdown <= 0) state.phase = 'playing';
    return;
  }

  if (state.phase !== 'playing') return;

  for (const player of Object.values(state.players)) {
    if (!player.alive) {
      if (player.respawnTimer > 0) {
        player.respawnTimer--;
        if (player.respawnTimer === 0) respawnPlayer(state, player);
      }
      continue;
    }
    if (player.invincible > 0) player.invincible--;
    movePlayer(state, player);
    tryPlaceBomb(state, player);
    collectPowerup(state, player);
  }

  for (let i = state.bombs.length - 1; i >= 0; i--) {
    state.bombs[i].timer--;
    if (state.bombs[i].timer <= 0) {
      const bomb = state.bombs.splice(i, 1)[0];
      detonateBomb(state, bomb);
    }
  }

  for (let i = state.explosions.length - 1; i >= 0; i--) {
    state.explosions[i].timer--;
    if (state.explosions[i].timer <= 0) state.explosions.splice(i, 1);
  }

  checkWin(state);
}

function movePlayer(state: GameState, player: Player) {
  const tilesPerSec = 2 + player.speed; // speed 1→3, 2→4, 3→5
  const inc = tilesPerSec / TICK_RATE;

  if (player.isMoving) {
    player.moveProgress += inc;
    if (player.moveProgress >= 1) {
      player.tileX += player.moveDirX;
      player.tileY += player.moveDirY;
      player.moveProgress = 0;
      player.isMoving = false;
      player.moveDirX = 0;
      player.moveDirY = 0;
    }
  }

  if (!player.isMoving) {
    let dx = 0, dy = 0;
    if (player.keys.up) dy = -1;
    else if (player.keys.down) dy = 1;
    else if (player.keys.left) dx = -1;
    else if (player.keys.right) dx = 1;

    if ((dx !== 0 || dy !== 0) && canStep(state, player.tileX + dx, player.tileY + dy)) {
      player.isMoving = true;
      player.moveDirX = dx;
      player.moveDirY = dy;
      player.moveProgress = inc;
    }
  }
}

function canStep(state: GameState, x: number, y: number): boolean {
  if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return false;
  const tile = state.map[y]?.[x];
  if (tile === 'wall' || tile === 'soft') return false;
  if (state.bombs.some(b => b.x === x && b.y === y)) return false;
  return true;
}

function tryPlaceBomb(state: GameState, player: Player) {
  const pressed = player.keys.bomb;
  const justPressed = pressed && !player.lastBombKey;
  player.lastBombKey = pressed;

  if (!justPressed) return;
  if (player.activeBombs >= player.bombCount) return;
  if (state.bombs.some(b => b.x === player.tileX && b.y === player.tileY)) return;

  state.bombs.push({
    id: uid(),
    ownerId: player.id,
    x: player.tileX,
    y: player.tileY,
    timer: BOMB_TIMER_TICKS,
    radius: player.blastRadius,
  });
  player.activeBombs++;
}

function collectPowerup(state: GameState, player: Player) {
  for (let i = state.powerups.length - 1; i >= 0; i--) {
    const pu = state.powerups[i];
    if (pu.x === player.tileX && pu.y === player.tileY) {
      applyPowerup(player, pu.type);
      state.powerups.splice(i, 1);
    }
  }
}

function applyPowerup(player: Player, type: PowerupType) {
  if (type === 'bomb') player.bombCount = Math.min(8, player.bombCount + 1);
  if (type === 'radius') player.blastRadius = Math.min(6, player.blastRadius + 1);
  if (type === 'speed') player.speed = Math.min(3, player.speed + 1);
}

function detonateBomb(state: GameState, bomb: Bomb) {
  const owner = state.players[bomb.ownerId];
  if (owner) owner.activeBombs = Math.max(0, owner.activeBombs - 1);

  const cells: { x: number; y: number }[] = [{ x: bomb.x, y: bomb.y }];
  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

  for (const [dx, dy] of dirs) {
    for (let i = 1; i <= bomb.radius; i++) {
      const cx = bomb.x + dx * i;
      const cy = bomb.y + dy * i;
      if (cx < 0 || cx >= MAP_WIDTH || cy < 0 || cy >= MAP_HEIGHT) break;
      const tile = state.map[cy][cx];
      if (tile === 'wall') break;
      cells.push({ x: cx, y: cy });
      if (tile === 'soft') {
        state.map[cy][cx] = 'empty';
        maybeDropPowerup(state, cx, cy, bomb.timer);
        break;
      }
    }
  }

  state.explosions.push({ id: uid(), cells, timer: EXPLOSION_DURATION_TICKS });

  // Chain reaction
  for (const cell of cells) {
    for (const b of state.bombs) {
      if (b.x === cell.x && b.y === cell.y) b.timer = 1;
    }
    // Destroy powerups caught in explosion
    for (let i = state.powerups.length - 1; i >= 0; i--) {
      const pu = state.powerups[i];
      if (pu.x === cell.x && pu.y === cell.y) state.powerups.splice(i, 1);
    }
  }

  // Hit players
  for (const player of Object.values(state.players)) {
    if (!player.alive || player.invincible > 0) continue;
    const px = player.isMoving ? player.tileX + player.moveDirX : player.tileX;
    const py = player.isMoving ? player.tileY + player.moveDirY : player.tileY;
    if (cells.some(c => (c.x === player.tileX && c.y === player.tileY) || (c.x === px && c.y === py))) {
      hitPlayer(state, player);
    }
  }
}

function maybeDropPowerup(state: GameState, x: number, y: number, seed: number) {
  const r = ((x * 73856093) ^ (y * 19349663) ^ (seed * 83492791)) >>> 0;
  if ((r % 10) < 3) {
    const types: PowerupType[] = ['bomb', 'radius', 'speed'];
    state.powerups.push({ id: uid(), x, y, type: types[r % 3] });
  }
}

function hitPlayer(state: GameState, player: Player) {
  player.lives--;
  player.alive = false;
  player.isMoving = false;
  player.activeBombs = 0;
  if (player.lives > 0) {
    player.respawnTimer = RESPAWN_TIMER_TICKS;
  }
}

function respawnPlayer(state: GameState, player: Player) {
  const spawn = SPAWN_POSITIONS[player.colorIndex];
  player.tileX = spawn.x;
  player.tileY = spawn.y;
  player.alive = true;
  player.invincible = INVINCIBLE_TICKS;
  player.moveProgress = 0;
  player.moveDirX = 0;
  player.moveDirY = 0;
  player.isMoving = false;
}

function checkWin(state: GameState) {
  const alive = Object.values(state.players).filter(p => p.lives > 0);
  if (alive.length <= 1) {
    state.winner = alive[0]?.id ?? null;
    state.phase = 'gameover';
  }
}
