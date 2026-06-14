'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function generateRoomCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  const createRoom = () => {
    const code = generateRoomCode();
    router.push(`/game/${code}`);
  };

  const joinRoom = () => {
    const code = joinCode.trim();
    if (!/^\d{4}$/.test(code)) {
      setError('请输入4位数字房间码');
      return;
    }
    router.push(`/game/${code}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 gap-8">
      <div className="text-center">
        <div className="text-7xl mb-2">💣</div>
        <h1 className="text-5xl font-black text-yellow-400 tracking-wider">BOMBERMAN</h1>
        <p className="text-gray-500 mt-2 text-sm">多人炸弹人游戏 · Multiplayer</p>
      </div>

      <button
        onClick={createRoom}
        className="w-full max-w-xs py-5 rounded-2xl text-xl font-black bg-yellow-400 text-gray-900 hover:bg-yellow-300 active:scale-95 transition-all shadow-xl shadow-yellow-400/20"
      >
        创建房间 CREATE ROOM
      </button>

      <div className="flex items-center gap-3 w-full max-w-xs">
        <div className="flex-1 h-px bg-gray-700" />
        <span className="text-gray-600 text-sm">或 OR</span>
        <div className="flex-1 h-px bg-gray-700" />
      </div>

      <div className="w-full max-w-xs flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={joinCode}
            onChange={e => { setJoinCode(e.target.value.replace(/\D/g, '')); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && joinRoom()}
            placeholder="输入房间码 0000"
            className="flex-1 bg-gray-800 text-white text-center text-2xl font-black tracking-[0.3em] rounded-xl px-4 py-4 border border-gray-700 focus:border-yellow-400 outline-none placeholder:text-gray-600 placeholder:text-lg placeholder:tracking-normal"
          />
          <button
            onClick={joinRoom}
            className="px-5 py-4 rounded-xl bg-gray-700 text-white font-bold hover:bg-gray-600 active:scale-95 transition-all"
          >
            加入
          </button>
        </div>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>

      <div className="text-center text-gray-600 text-xs max-w-xs">
        <p>创建房间后分享4位数字给朋友</p>
        <p>支持2–4名玩家同时游戏</p>
      </div>
    </div>
  );
}
