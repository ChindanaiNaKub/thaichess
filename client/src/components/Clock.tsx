import { useEffect, useState } from 'react';
import type { PieceColor } from '@shared/types';

interface ClockProps {
  time: number; // milliseconds
  isActive: boolean;
  color: PieceColor;
  playerName: string;
}

function formatTime(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function Clock({ time, isActive, color, playerName }: ClockProps) {
  const [displayTime, setDisplayTime] = useState(time);

  useEffect(() => {
    setDisplayTime(time);
  }, [time]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setDisplayTime(prev => Math.max(0, prev - 100));
    }, 100);

    return () => clearInterval(interval);
  }, [isActive]);

  const isLow = displayTime < 30000;
  const isCritical = displayTime < 10000;

  return (
    <div className={`
      flex items-center justify-between rounded-lg px-5 py-2.5 w-full
      transition-all duration-200
      ${isActive
        ? isCritical
          ? 'bg-danger/20 border border-danger/40'
          : 'bg-primary/15 border border-primary/30'
        : 'bg-surface-alt border border-surface-hover'
      }
    `}>
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${
          color === 'white' ? 'bg-white border border-gray-400' : 'bg-gray-800 border border-gray-600'
        }`} />
        <span className="text-text-bright text-base font-medium">{playerName}</span>
      </div>
      <div className={`
        font-mono text-2xl font-bold tabular-nums
        ${isCritical ? 'text-danger' : isLow ? 'text-accent' : 'text-text-bright'}
        ${isActive && isCritical ? 'animate-pulse' : ''}
      `}>
        {formatTime(displayTime)}
      </div>
    </div>
  );
}
