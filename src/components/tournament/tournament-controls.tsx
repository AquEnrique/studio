
'use client';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Play, SkipForward, RefreshCw } from 'lucide-react';

interface TournamentControlsProps {
  status: 'registration' | 'running' | 'finished';
  playerCount: number;
  onStart: () => void;
  onNextRound: () => void;
  onReset: () => void;
}

export function TournamentControls({
  status,
  playerCount,
  onStart,
  onNextRound,
  onReset,
}: TournamentControlsProps) {
  return (
    <div className="flex gap-2">
      {status === 'registration' && (
        <Button onClick={onStart} disabled={playerCount < 2}>
          <Play className="mr-2 h-4 w-4" /> Start Tournament
        </Button>
      )}

      {status === 'running' && (
        <Button onClick={onNextRound}>
          <SkipForward className="mr-2 h-4 w-4" /> Generate Next Round
        </Button>
      )}
      
      {(status === 'running' || status === 'finished') && (
         <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <RefreshCw className="mr-2 h-4 w-4" /> Reset Tournament
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete all players, rounds, and standings. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onReset}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
