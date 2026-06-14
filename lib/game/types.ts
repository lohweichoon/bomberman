export type TileType = 'wall' | 'soft' | 'empty';
export type PowerupType = 'bomb' | 'radius' | 'speed';
export type GamePhase = 'lobby' | 'countdown' | 'playing' | 'gameover';

export interface PlayerKeys {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  bomb: boolean;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  colorIndex: number;
  tileX: number;
  tileY: number;
  moveProgress: number;
  moveDirX: number;
  moveDirY: number;
  isMoving: boolean;
  lives: number;
  bombCount: number;
  activeBombs: number;
  blastRadius: number;
  speed: number;
  alive: boolean;
  respawnTimer: number;
  invincible: number;
  keys: PlayerKeys;
  lastBombKey: boolean;
}

export interface Bomb {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  timer: number;
  radius: number;
}

export interface Explosion {
  id: string;
  cells: { x: number; y: number }[];
  timer: number;
}

export interface Powerup {
  id: string;
  x: number;
  y: number;
  type: PowerupType;
}

export interface GameState {
  phase: GamePhase;
  map: TileType[][];
  players: Record<string, Player>;
  bombs: Bomb[];
  explosions: Explosion[];
  powerups: Powerup[];
  countdown: number;
  winner: string | null;
  hostId: string;
  maxLives: number;
  tick: number;
}

export type ClientMessage =
  | { type: 'setName'; name: string }
  | { type: 'startGame' }
  | { type: 'setMaxLives'; lives: number }
  | { type: 'input'; keys: PlayerKeys }
  | { type: 'restartGame' };

export type ServerMessage =
  | { type: 'joined'; playerId: string; state: GameState }
  | { type: 'state'; state: GameState }
  | { type: 'tick'; state: GameState }
  | { type: 'full' };
