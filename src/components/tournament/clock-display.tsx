'use client';

import { useClock } from '@/context/clock-provider';
import { Button } from '@/components/ui/button';
import { Play, Pause, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTournament } from '@/context/tournament-provider';

export function ClockDisplay() {
  const { tournament } = useTournament();
  const { remainingTime, isPaused, togglePause, startRoundTimer, startTime, isFinished } = useClock();

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
    <div className={cn("flex items-center gap-2 rounded-full p-1 text-sm font-semibold", isFinished ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-muted")}>
      <span className="px-2 font-mono tracking-wider">
        {formatTime(remainingTime)}
      </span>
      <Button variant={isPaused ? 'default' : 'secondary'} size="icon" className="h-7 w-7 rounded-full" onClick={togglePause}>
        {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        <span className="sr-only">{isPaused ? 'Play' : 'Pause'}</span>
      </Button>
      <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full" onClick={startRoundTimer}>
        <RefreshCw className="h-4 w-4" />
        <span className="sr-only">Reset Timer</span>
      </Button>
    </div>
  );
}
