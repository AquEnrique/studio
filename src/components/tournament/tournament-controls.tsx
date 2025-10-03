
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
  isMobile: boolean;
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
  isMobile,
}: TournamentControlsProps) {
  const displayedRound = viewingRound ?? currentRound;

  const renderButton = (
    icon: React.ReactNode,
    text: string,
    onClick: () => void,
    props: React.ComponentProps<typeof Button> = {}
  ) => {
    return (
      <Button onClick={onClick} {...props}>
        {icon}
        {!isMobile && <span>{text}</span>}
      </Button>
    );
  };
  
  const renderAlertDialogButton = (
    icon: React.ReactNode,
    text: string,
    dialogTitle: string,
    dialogDescription: string,
    onConfirm: () => void,
    props: React.ComponentProps<typeof Button> = {}
  ) => {
     return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
             <Button {...props}>
                {icon}
                {!isMobile && <span>{text}</span>}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {dialogDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirm}>Reset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
     )
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-2 z-10">
        <div className="container mx-auto flex items-center justify-center gap-2">
            {status === 'registration' && renderButton(
                <Play />, "Start Tournament", onStart, { disabled: playerCount < 2 }
            )}

            {status === 'running' && (
                <>
                {renderButton(
                    <ChevronLeft />, "Previous Round", () => onGoToRound(displayedRound > 1 ? displayedRound - 1 : null), { variant: "outline", disabled: displayedRound <= 1 }
                )}

                {viewingRound !== null && viewingRound < currentRound ? (
                     renderButton(<ChevronRight />, `To Round ${currentRound}`, () => onGoToRound(null))
                ) : (
                    allResultsSubmitted && renderButton(<SkipForward />, "Next Round", onNextRound)
                )}
                </>
            )}
            
            {(status === 'running' || status === 'finished') && (
                renderAlertDialogButton(
                    <RefreshCw />, "Reset", "Are you sure?", "This will delete all players, rounds, and standings. This action cannot be undone.", onReset, { variant: "destructive" }
                )
            )}
        </div>
    </footer>
  );
}
