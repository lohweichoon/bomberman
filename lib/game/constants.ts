export const MAP_WIDTH = 13;
export const MAP_HEIGHT = 11;
export const TILE_SIZE = 40;

export const BOMB_TIMER_TICKS = 60;       // 3s at 20 ticks/s
export const EXPLOSION_DURATION_TICKS = 10; // 0.5s
export const RESPAWN_TIMER_TICKS = 40;    // 2s
export const INVINCIBLE_TICKS = 60;       // 3s
export const COUNTDOWN_TICKS = 60;        // 3s

export const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
export const PLAYER_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

export const SPAWN_POSITIONS = [
  { x: 1, y: 1 },   // P1 top-left
  { x: 11, y: 9 },  // P2 bottom-right
  { x: 1, y: 9 },   // P3 bottom-left
  { x: 11, y: 1 },  // P4 top-right
];

// Tiles cleared around each spawn so players don't start trapped
export const SPAWN_CLEAR: { x: number; y: number }[][] = [
  [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
  [{ x: 11, y: 9 }, { x: 10, y: 9 }, { x: 11, y: 8 }],
  [{ x: 1, y: 9 }, { x: 2, y: 9 }, { x: 1, y: 8 }],
  [{ x: 11, y: 1 }, { x: 10, y: 1 }, { x: 11, y: 2 }],
];

export const TICK_RATE = 20; // ticks per second
export const TICK_INTERVAL_MS = 1000 / TICK_RATE;

// Speed: tiles per second for speed level 1/2/3
export const SPEED_TILES_PER_SEC = [3, 4, 5];
