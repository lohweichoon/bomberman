'use client';
import { use, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, PlayerKeys } from '@/lib/game/types';
import GameCanvas from '@/components/GameCanvas';
import MobileControls from '@/components/MobileControls';
import Lobby from '@/components/Lobby';
import GameOver from '@/components/GameOver';

const SERVER_URL = process.env.NEXT_PUBLIC_GAME_SERVER_URL ?? 'http://localhost:3001';

export default function GamePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const [state, setState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const lastKeysRef = useRef<PlayerKeys>({ up: false, down: false, left: false, right: false, bomb: false });

  useEffect(() => {
    const socket = io(SERVER_URL, { query: { room: roomId } });
    socketRef.current = socket;

    socket.on('joined', ({ playerId, state }: { playerId: string; state: GameState }) => {
      setPlayerId(playerId);
      setState(state);
    });
    socket.on('state', (state: GameState) => setState(state));
    socket.on('tick', (state: GameState) => setState(state));
    socket.on('full', () => alert('房间已满！Room is full.'));

    return () => { socket.disconnect(); };
  }, [roomId]);

  const send = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  // Keyboard input
  useEffect(() => {
    const keyMap: Record<string, keyof PlayerKeys> = {
      ArrowUp: 'up', KeyW: 'up',
      ArrowDown: 'down', KeyS: 'down',
      ArrowLeft: 'left', KeyA: 'left',
      ArrowRight: 'right', KeyD: 'right',
      Space: 'bomb', Enter: 'bomb',
    };

    const update = (code: string, value: boolean) => {
      const key = keyMap[code];
      if (!key) return;
      const cur = lastKeysRef.current;
      if (cur[key] === value) return;
      const next = { ...cur, [key]: value };
      lastKeysRef.current = next;
      send('input', next);
    };

    const onDown = (e: KeyboardEvent) => { if (keyMap[e.code]) e.preventDefault(); update(e.code, true); };
    const onUp = (e: KeyboardEvent) => update(e.code, false);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [send]);

  const handleMobileKeys = useCallback((keys: PlayerKeys) => {
    lastKeysRef.current = keys;
    send('input', keys);
  }, [send]);

  if (!state || !playerId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl mb-4 animate-bounce">💣</div>
          <p className="text-gray-400">连接中 Connecting…</p>
        </div>
      </div>
    );
  }

  if (state.phase === 'lobby') {
    return (
      <Lobby
        state={state}
        playerId={playerId}
        roomId={roomId}
        onStart={() => send('startGame')}
        onSetName={name => send('setName', name)}
        onSetLives={lives => send('setMaxLives', lives)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* HUD */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-950 border-b border-gray-800 flex-shrink-0">
        <span className="text-yellow-400 font-black text-lg">💣</span>
        <div className="flex gap-3 flex-wrap justify-center">
          {Object.values(state.players).map(p => (
            <div key={p.id} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ background: p.color }} />
              <span className={`text-xs font-bold ${p.id === playerId ? 'text-yellow-400' : 'text-gray-300'}`}>
                {p.name.slice(0, 6)}
              </span>
              <span className="text-xs text-red-400">{'♥'.repeat(Math.max(0, p.lives))}</span>
            </div>
          ))}
        </div>
        <span className="text-gray-600 text-xs font-mono">{roomId}</span>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex items-start justify-center bg-gray-950 overflow-hidden">
        <div className="w-full max-w-lg">
          <GameCanvas state={state} playerId={playerId} />
        </div>
      </div>

      {/* Mobile D-pad */}
      {state.phase === 'playing' && (
        <div className="bg-gray-900 border-t border-gray-800 flex-shrink-0">
          <MobileControls onKeys={handleMobileKeys} />
        </div>
      )}

      {state.phase === 'gameover' && (
        <GameOver
          state={state}
          playerId={playerId}
          onRestart={() => send('restartGame')}
        />
      )}
    </div>
  );
}
