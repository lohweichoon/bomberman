'use client';
import { GameState } from '@/lib/game/types';
import { PLAYER_COLORS } from '@/lib/game/constants';

interface Props {
  state: GameState;
  playerId: string;
  roomId: string;
  onStart: () => void;
  onSetName: (name: string) => void;
  onSetLives: (lives: number) => void;
}

export default function Lobby({ state, playerId, roomId, onStart, onSetName, onSetLives }: Props) {
  const isHost = playerId === state.hostId;
  const players = Object.values(state.players);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 gap-6">
      <h1 className="text-4xl font-black text-yellow-400 tracking-wider drop-shadow">💣 BOMBERMAN</h1>

      {/* Room code */}
      <div className="bg-gray-800 rounded-2xl px-8 py-4 text-center border border-gray-700">
        <p className="text-gray-400 text-sm mb-1">房间码 Room Code</p>
        <p className="text-5xl font-black text-white tracking-[0.3em]">{roomId}</p>
        <p className="text-gray-500 text-xs mt-1">分享给朋友 Share with friends</p>
      </div>

      {/* Players */}
      <div className="w-full max-w-sm">
        <p className="text-gray-400 text-sm mb-2 text-center">玩家 Players ({players.length}/4)</p>
        <div className="flex flex-col gap-2">
          {players.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
              <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: PLAYER_COLORS[p.colorIndex] }} />
              {p.id === playerId ? (
                <input
                  className="bg-transparent text-white font-bold flex-1 outline-none border-b border-gray-600 focus:border-yellow-400"
                  defaultValue={p.name}
                  maxLength={12}
                  onBlur={e => onSetName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  placeholder="你的名字"
                />
              ) : (
                <span className="text-white font-bold flex-1">{p.name}</span>
              )}
              {p.id === state.hostId && (
                <span className="text-yellow-400 text-xs font-bold">👑 房主</span>
              )}
              {p.id === playerId && p.id !== state.hostId && (
                <span className="text-green-400 text-xs">← 你</span>
              )}
            </div>
          ))}
          {Array.from({ length: 4 - players.length }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-800/50 rounded-xl px-4 py-3 border border-dashed border-gray-700">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0" />
              <span className="text-gray-600 text-sm">等待玩家加入…</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lives setting (host only) */}
      {isHost && (
        <div className="bg-gray-800 rounded-2xl px-6 py-4 border border-gray-700 w-full max-w-sm">
          <p className="text-gray-400 text-sm mb-3 text-center">每人生命数 Lives per player</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => onSetLives(n)}
                className={`w-10 h-10 rounded-xl font-black text-lg transition-all ${
                  state.maxLives === n
                    ? 'bg-yellow-400 text-gray-900 scale-110'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-gray-500 text-xs text-center mt-2">❤️ × {state.maxLives}</p>
        </div>
      )}

      {/* Start button */}
      {isHost ? (
        <button
          onClick={onStart}
          disabled={players.length < 2}
          className="w-full max-w-sm py-4 rounded-2xl text-xl font-black bg-yellow-400 text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-300 active:scale-95 transition-all shadow-lg shadow-yellow-400/30"
        >
          {players.length < 2 ? '等待更多玩家… (需至少2人)' : '开始游戏 START'}
        </button>
      ) : (
        <div className="text-gray-500 text-sm text-center">等待房主开始游戏…</div>
      )}
    </div>
  );
}
