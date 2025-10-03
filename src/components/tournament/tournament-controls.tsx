
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
import { Play, SkipForward, RefreshCw, ChevronLeft, ChevronRight, Upload, Download } from 'lucide-react';
import { useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

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
  onImport: (fileContent: string) => void;
  onExport: () => string;
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
  onImport,
  onExport,
  isMobile,
}: TournamentControlsProps) {
  const displayedRound = viewingRound ?? currentRound;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleExport = () => {
    try {
      const tournamentJson = onExport();
      const blob = new Blob([tournamentJson], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tournament-export-${new Date().toISOString()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Success", description: "Tournament data exported successfully." });
    } catch (error) {
      console.error("Export failed:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to export tournament data." });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          // Trigger confirmation dialog
          onImport(content);
        } catch (error) {
           console.error("Import failed:", error);
           toast({ variant: "destructive", title: "Import Failed", description: "The selected file is not a valid tournament file." });
        }
      };
      reader.readAsText(file);
    }
     // Reset file input value to allow uploading the same file again
    if(event.target) {
        event.target.value = '';
    }
  };

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
    confirmText: string = "Confirm",
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
              <AlertDialogAction onClick={onConfirm}>{confirmText}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
     )
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-2 z-10">
        <div className="container mx-auto flex items-center justify-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".txt,application/json"
              onChange={handleFileChange}
            />

            {renderButton(<Upload />, "Import", handleImportClick, { variant: "outline" })}
            {renderButton(<Download />, "Export", handleExport, { variant: "outline" })}
            
            <div className="flex-grow" />

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
                    <RefreshCw />, "Reset", "Are you sure?", "This will delete all players, rounds, and standings. This action cannot be undone.", onReset, "Reset", { variant: "destructive" }
                )
            )}
        </div>
    </footer>
  );
}
