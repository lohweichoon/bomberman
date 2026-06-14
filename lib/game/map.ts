import { TileType } from './types';
import { MAP_WIDTH, MAP_HEIGHT, SPAWN_CLEAR } from './constants';

export function generateMap(seed: number): TileType[][] {
  const map: TileType[][] = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    map[y] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (isBorderOrInteriorWall(x, y)) {
        map[y][x] = 'wall';
      } else {
        map[y][x] = 'empty';
      }
    }
  }

  // Collect spawn-clear tiles
  const clearSet = new Set<string>();
  for (const clears of SPAWN_CLEAR) {
    for (const pos of clears) {
      clearSet.add(`${pos.x},${pos.y}`);
    }
  }

  // Fill non-wall, non-spawn tiles with soft blocks (~70%)
  let r = seed;
  const rand = () => {
    r = (r * 1664525 + 1013904223) & 0xffffffff;
    return (r >>> 0) / 0xffffffff;
  };

  for (let y = 1; y < MAP_HEIGHT - 1; y++) {
    for (let x = 1; x < MAP_WIDTH - 1; x++) {
      if (map[y][x] === 'wall') continue;
      if (clearSet.has(`${x},${y}`)) continue;
      if (rand() < 0.7) {
        map[y][x] = 'soft';
      }
    }
  }

  return map;
}

function isBorderOrInteriorWall(x: number, y: number): boolean {
  if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) return true;
  if (x % 2 === 0 && y % 2 === 0) return true;
  return false;
}
