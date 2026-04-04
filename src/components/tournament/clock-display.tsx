'use client';

import { useClock } from '@/context/clock-provider';
import { cn } from '@/lib/utils';
import { useTournament } from '@/context/tournament-provider';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
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
    <div className="flex items-center gap-2">
      <div className={cn("flex items-center gap-2 rounded-full p-1 px-3 text-sm font-semibold", isFinished ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-muted")}>
        <span className="px-2 font-mono tracking-wider">
          {formatTime(remainingTime)}
        </span>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={refreshClock}>
        <RefreshCw className="h-4 w-4" />
        <span className="sr-only">Sincronizar Reloj</span>
      </Button>
    </div>
  );
}
