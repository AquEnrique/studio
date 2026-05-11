
'use client';

import { useClock } from '@/context/clock-provider';
import { cn } from '@/lib/utils';
import { useTournament } from '@/context/tournament-provider';
import { useEffect } from 'react';

export function ClockDisplay() {
  const { tournament } = useTournament();
  const { remainingTime, startTime, isFinished, refreshClock } = useClock();

  useEffect(() => {
    if (tournament?.status !== 'running') {
      return;
    }

    const pollInterval = setInterval(() => {
      refreshClock();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }, [tournament?.status, refreshClock]);

  if (tournament?.status !== 'running' || !startTime) {
    return null;
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center">
      <div className={cn(
        "flex items-center gap-3 rounded-full p-2 px-6 text-2xl md:text-5xl font-black transition-all border-2", 
        isFinished 
          ? "bg-destructive text-destructive-foreground border-destructive animate-pulse" 
          : "bg-primary text-primary-foreground border-primary-foreground/20 shadow-xl"
      )}>
        <span className="font-mono tracking-tighter">
          {formatTime(remainingTime)}
        </span>
      </div>
    </div>
  );
}
