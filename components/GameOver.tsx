'use client';
import { GameState } from '@/lib/game/types';
import { PLAYER_COLORS } from '@/lib/game/constants';

interface Props {
  state: GameState;
  playerId: string;
  onRestart: () => void;
}

export default function GameOver({ state, playerId, onRestart }: Props) {
  const winner = state.winner ? state.players[state.winner] : null;
  const isHost = playerId === state.hostId;
  const isWinner = state.winner === playerId;

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center gap-6 z-50 p-4">
      <div className="text-center">
        {winner ? (
          <>
            <div
              className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl border-4 border-white shadow-2xl"
              style={{ background: PLAYER_COLORS[winner.colorIndex] }}
            >
              🏆
            </div>
            <h2 className="text-4xl font-black text-yellow-400 mb-1">{winner.name}</h2>
            <p className="text-white text-xl">{isWinner ? '你赢了！🎉' : '获胜了！'}</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">🤝</div>
            <h2 className="text-4xl font-black text-gray-300">平局！</h2>
          </>
        )}
      </div>

      {/* Scoreboard */}
      <div className="w-full max-w-xs bg-gray-900 rounded-2xl p-4 border border-gray-700">
        {Object.values(state.players)
          .sort((a, b) => b.lives - a.lives)
          .map(p => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
              <div className="w-6 h-6 rounded-full" style={{ background: PLAYER_COLORS[p.colorIndex] }} />
              <span className={`flex-1 font-bold ${p.id === playerId ? 'text-yellow-400' : 'text-white'}`}>
                {p.name}
              </span>
              <span className="text-gray-400 text-sm">
                {'❤️'.repeat(Math.max(0, p.lives))}
                {'🖤'.repeat(Math.max(0, state.maxLives - p.lives))}
              </span>
            </div>
          ))}
      </div>

      {isHost ? (
        <button
          onClick={onRestart}
          className="w-full max-w-xs py-4 rounded-2xl text-xl font-black bg-yellow-400 text-gray-900 hover:bg-yellow-300 active:scale-95 transition-all shadow-lg"
        >
          再来一局 PLAY AGAIN
        </button>
      ) : (
        <p className="text-gray-500 text-sm">等待房主再来一局…</p>
      )}
    </div>
  );
}
