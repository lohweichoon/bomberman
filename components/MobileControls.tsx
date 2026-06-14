'use client';
import { useEffect, useRef } from 'react';
import { PlayerKeys } from '@/lib/game/types';

interface Props {
  onKeys: (keys: PlayerKeys) => void;
}

export default function MobileControls({ onKeys }: Props) {
  const keysRef = useRef<PlayerKeys>({ up: false, down: false, left: false, right: false, bomb: false });

  const setKey = (key: keyof PlayerKeys, value: boolean) => {
    const next = { ...keysRef.current, [key]: value };
    keysRef.current = next;
    onKeys(next);
  };

  const btn = (key: keyof PlayerKeys, label: string, className: string) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); setKey(key, true); },
    onPointerUp: (e: React.PointerEvent) => { e.preventDefault(); setKey(key, false); },
    onPointerLeave: (e: React.PointerEvent) => { e.preventDefault(); setKey(key, false); },
    onPointerCancel: (e: React.PointerEvent) => { e.preventDefault(); setKey(key, false); },
    className,
    children: label,
    style: { touchAction: 'none', userSelect: 'none' as const },
  });

  return (
    <div className="flex items-center justify-between px-6 py-4 select-none">
      {/* D-pad */}
      <div className="relative w-36 h-36">
        {/* Up */}
        <button {...btn('up', '▲', 'absolute top-0 left-1/2 -translate-x-1/2 w-11 h-11 rounded-xl bg-white/20 active:bg-white/40 flex items-center justify-center text-white text-lg font-bold border border-white/30')} />
        {/* Down */}
        <button {...btn('down', '▼', 'absolute bottom-0 left-1/2 -translate-x-1/2 w-11 h-11 rounded-xl bg-white/20 active:bg-white/40 flex items-center justify-center text-white text-lg font-bold border border-white/30')} />
        {/* Left */}
        <button {...btn('left', '◀', 'absolute left-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-white/20 active:bg-white/40 flex items-center justify-center text-white text-lg font-bold border border-white/30')} />
        {/* Right */}
        <button {...btn('right', '▶', 'absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl bg-white/20 active:bg-white/40 flex items-center justify-center text-white text-lg font-bold border border-white/30')} />
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-5 h-5 rounded-full bg-white/10" />
        </div>
      </div>

      {/* Bomb button */}
      <button
        {...btn('bomb', '💣', 'w-20 h-20 rounded-full bg-red-500/80 active:bg-red-400 flex items-center justify-center text-3xl border-4 border-red-300/50 shadow-lg shadow-red-500/30')}
      />
    </div>
  );
}
