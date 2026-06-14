'use client';
import { useEffect, useRef } from 'react';
import { GameState } from '@/lib/game/types';
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '@/lib/game/constants';

const COLORS = {
  bg: '#1a1a2e',
  floor: '#2d5a27',
  floorAlt: '#3a7a33',
  wall: '#4a4a5a',
  wallTop: '#6a6a7a',
  soft: '#8b5e3c',
  softTop: '#c47c4a',
  bomb: '#1a1a1a',
  bombFuse: '#e74c3c',
  explosionCenter: '#ff6b00',
  explosionArm: '#ffcc00',
  powerupBomb: '#e74c3c',
  powerupRadius: '#ff8c00',
  powerupSpeed: '#00bcd4',
};

const POWERUP_ICONS: Record<string, string> = {
  bomb: '💣',
  radius: '🔥',
  speed: '👟',
};

export default function GameCanvas({
  state,
  playerId,
}: {
  state: GameState;
  playerId: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    let lastTick = -1;

    const draw = () => {
      animId = requestAnimationFrame(draw);
      const s = stateRef.current;
      if (s.tick === lastTick) return;
      lastTick = s.tick;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = canvas.width / (MAP_WIDTH * TILE_SIZE);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(scale, scale);

      drawMap(ctx, s);
      drawPowerups(ctx, s);
      drawBombs(ctx, s);
      drawExplosions(ctx, s);
      drawPlayers(ctx, s, playerId);

      if (s.phase === 'countdown') {
        drawCountdown(ctx, s);
      }

      ctx.restore();
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [playerId]);

  return (
    <canvas
      ref={canvasRef}
      width={MAP_WIDTH * TILE_SIZE}
      height={MAP_HEIGHT * TILE_SIZE}
      style={{ width: '100%', height: 'auto', imageRendering: 'pixelated', display: 'block' }}
    />
  );
}

function drawMap(ctx: CanvasRenderingContext2D, state: GameState) {
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const tile = state.map[y]?.[x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      if (tile === 'wall') {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE * 0.4);
        // Corner bolts
        ctx.fillStyle = '#333';
        for (const [bx, by] of [[4, 4], [TILE_SIZE - 8, 4], [4, TILE_SIZE - 8], [TILE_SIZE - 8, TILE_SIZE - 8]]) {
          ctx.beginPath();
          ctx.arc(px + bx, py + by, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (tile === 'soft') {
        ctx.fillStyle = COLORS.soft;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = COLORS.softTop;
        ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
        // Wood grain lines
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + 6, py + 3);
        ctx.lineTo(px + 6, py + TILE_SIZE - 3);
        ctx.moveTo(px + 14, py + 3);
        ctx.lineTo(px + 14, py + TILE_SIZE - 3);
        ctx.moveTo(px + 22, py + 3);
        ctx.lineTo(px + 22, py + TILE_SIZE - 3);
        ctx.stroke();
      } else {
        // Floor — checkerboard
        ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}

function drawPowerups(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const pu of state.powerups) {
    const px = pu.x * TILE_SIZE;
    const py = pu.y * TILE_SIZE;
    const bgColor = pu.type === 'bomb' ? COLORS.powerupBomb
      : pu.type === 'radius' ? COLORS.powerupRadius
      : COLORS.powerupSpeed;

    ctx.fillStyle = bgColor;
    roundRect(ctx, px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12, 6);
    ctx.fill();

    ctx.font = `${TILE_SIZE * 0.55}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(POWERUP_ICONS[pu.type], px + TILE_SIZE / 2, py + TILE_SIZE / 2);
  }
}

function drawBombs(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const bomb of state.bombs) {
    const cx = bomb.x * TILE_SIZE + TILE_SIZE / 2;
    const cy = bomb.y * TILE_SIZE + TILE_SIZE / 2;
    const r = TILE_SIZE * 0.35;
    const pulse = 0.9 + Math.sin(bomb.timer * 0.3) * 0.1;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.9, r * 0.8, r * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = COLORS.bomb;
    ctx.beginPath();
    ctx.arc(cx, cy, r * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Fuse
    ctx.strokeStyle = COLORS.bombFuse;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.3, cy - r * 0.7);
    ctx.quadraticCurveTo(cx + r * 0.8, cy - r * 1.2, cx + r * 0.4, cy - r * 1.4);
    ctx.stroke();

    // Fuse spark
    const sparkOn = (bomb.timer % 6) < 3;
    if (sparkOn) {
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(cx + r * 0.4, cy - r * 1.4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawExplosions(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const exp of state.explosions) {
    const alpha = exp.timer / 10;
    for (const cell of exp.cells) {
      const px = cell.x * TILE_SIZE;
      const py = cell.y * TILE_SIZE;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = COLORS.explosionArm;
      ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);

      ctx.fillStyle = COLORS.explosionCenter;
      ctx.fillRect(px + 8, py + 8, TILE_SIZE - 16, TILE_SIZE - 16);
      ctx.globalAlpha = 1;
    }
  }
}

function drawPlayers(ctx: CanvasRenderingContext2D, state: GameState, myId: string) {
  for (const player of Object.values(state.players)) {
    if (!player.alive) continue;

    const rx = player.tileX + (player.isMoving ? player.moveDirX * player.moveProgress : 0);
    const ry = player.tileY + (player.isMoving ? player.moveDirY * player.moveProgress : 0);
    const cx = rx * TILE_SIZE + TILE_SIZE / 2;
    const cy = ry * TILE_SIZE + TILE_SIZE / 2;
    const r = TILE_SIZE * 0.38;

    // Blink when invincible
    if (player.invincible > 0 && Math.floor(player.invincible / 4) % 2 === 1) continue;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + r * 0.85, r * 0.75, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Outline (thicker for "me")
    ctx.strokeStyle = player.id === myId ? '#fff' : 'rgba(0,0,0,0.5)';
    ctx.lineWidth = player.id === myId ? 2.5 : 1.5;
    ctx.stroke();

    // Face
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    // Eyes
    ctx.beginPath();
    ctx.arc(cx - r * 0.28, cy - r * 0.15, r * 0.14, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.28, cy - r * 0.15, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
    // Smile
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.1, r * 0.28, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Lives dots
    for (let i = 0; i < player.lives; i++) {
      ctx.fillStyle = player.color;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(cx - ((player.lives - 1) / 2 - i) * 5, cy - r - 5, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Player name tag
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    const nameW = ctx.measureText(player.name).width + 8;
    roundRect(ctx, cx - nameW / 2, cy + r + 2, nameW, 12, 3);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(player.name, cx, cy + r + 4);
  }
}

function drawCountdown(ctx: CanvasRenderingContext2D, state: GameState) {
  const sec = Math.ceil(state.countdown / 20);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE);
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${TILE_SIZE * 3}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(sec), (MAP_WIDTH * TILE_SIZE) / 2, (MAP_HEIGHT * TILE_SIZE) / 2);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
