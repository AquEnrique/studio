'use client';

import { useClock } from '@/context/clock-provider';
import { cn } from '@/lib/utils';
import { useTournament } from '@/context/tournament-provider';

export function ClockDisplay() {
  const { tournament } = useTournament();
  const { remainingTime, startTime, isFinished } = useClock();

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
    <div className={cn("flex items-center gap-2 rounded-full p-1 px-3 text-sm font-semibold", isFinished ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-muted")}>
      <span className="px-2 font-mono tracking-wider">
        {formatTime(remainingTime)}
      </span>
    </div>
  );
}
