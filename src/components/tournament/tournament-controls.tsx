
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
import { Play, SkipForward, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface TournamentControlsProps {
  status: 'registration' | 'running' | 'finished';
  playerCount: number;
  currentRound: number;
  viewingRound: number | null;
  allResultsSubmitted: boolean;
  onStart: () => void;
  onNextRound: () => void;
  onReset: () => void;
  onGoToRound: (round: number | null) => void;
}

export function TournamentControls({
  status,
  playerCount,
  currentRound,
  viewingRound,
  allResultsSubmitted,
  onStart,
  onNextRound,
  onReset,
  onGoToRound,
}: TournamentControlsProps) {
  const displayedRound = viewingRound ?? currentRound;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {status === 'registration' && (
        <Button onClick={onStart} disabled={playerCount < 2}>
          <Play className="mr-2 h-4 w-4" /> Start Tournament
        </Button>
      )}

      {status === 'running' && (
        <div className="flex gap-2">
           <Button 
            onClick={() => onGoToRound(displayedRound > 1 ? displayedRound - 1 : null)} 
            disabled={displayedRound <= 1}
            variant="outline"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous Round
          </Button>

          {viewingRound !== null && viewingRound < currentRound ? (
            <Button onClick={() => onGoToRound(null)}>
              Return to Current Round ({currentRound}) <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
             allResultsSubmitted && (
                <Button onClick={onNextRound}>
                  <SkipForward className="mr-2 h-4 w-4" /> Generate Next Round
                </Button>
              )
          )}
        </div>
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
