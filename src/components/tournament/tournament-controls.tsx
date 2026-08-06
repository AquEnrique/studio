
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
import { Play, SkipForward, RefreshCw, Upload, Save, PlayCircle, StopCircle, Copy } from 'lucide-react';
import { useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useClock } from '@/context/clock-provider';
import type { DisplayPairing } from '@/lib/types';

interface TournamentControlsProps {
  status: 'registration' | 'running' | 'finished';
  playerCount: number;
  onStart?: () => void;
  onNextRound?: () => void;
  onReset: () => void;
  onImport: (fileContent: string) => void;
  isMobile: boolean;
  allResultsSubmitted?: boolean;
  isViewingHistory?: boolean;
  currentRound?: number;
  isJudgeView?: boolean;
  onForceSave?: () => Promise<boolean>;
  currentPairings?: DisplayPairing[];
  roundsGenerated?: number;
  recommendedRounds?: number;
}

export function TournamentControls({
  status,
  playerCount,
  onStart,
  onNextRound,
  onReset,
  onImport,
  isMobile,
  allResultsSubmitted,
  isViewingHistory,
  isJudgeView,
  onForceSave,
  currentRound,
  currentPairings,
  roundsGenerated,
  recommendedRounds,
}: TournamentControlsProps) {
  const recommendedRoundsReached =
    typeof roundsGenerated === 'number' &&
    typeof recommendedRounds === 'number' &&
    roundsGenerated >= recommendedRounds;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { startRoundTimer, resetRoundTimer, requestNotificationPermission, startTime } = useClock();

  const handleStartTimer = () => {
    requestNotificationPermission();
    startRoundTimer();
    toast({ title: "¡Ronda iniciada!", description: "El reloj de 50 minutos ha comenzado." });
  }

  const handleStopTimer = () => {
    resetRoundTimer();
    toast({ title: "Reloj detenido", description: "El reloj de la ronda ha sido reiniciado." });
  }

  const handleResetTournament = () => {
    resetRoundTimer();
    onReset();
  }

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
          onImport(content);
        } catch (error) {
           console.error("Importación fallida:", error);
           toast({ variant: "destructive", title: "Importación Fallida", description: "El archivo seleccionado no es un archivo de torneo válido." });
        }
      };
      reader.readAsText(file);
    }
     if(event.target) {
        event.target.value = '';
    }
  };

  const handleForceSave = async () => {
    if (!onForceSave) return;
    const success = await onForceSave();
    if (success) {
        toast({ title: "¡Guardado!", description: "El estado del torneo ha sido sincronizado." });
    } else {
        toast({ variant: "destructive", title: "Error", description: "No se pudo sincronizar el estado del torneo." });
    }
  };

  const handleCopy = () => {
    if (!currentPairings || !currentRound) return;

    let text: string;

    if (allResultsSubmitted && !isViewingHistory) {
      // Last round's results are all in: instead of the pairings, share a
      // participant checklist (✅/❌ left blank on purpose) so judges can
      // mark payments off by hand in an external notepad.
      const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const participantNames: string[] = [];
      currentPairings.forEach((p) => {
        participantNames.push(p.player1.name);
        if (p.player2.id !== 'bye') {
          participantNames.push(p.player2.name);
        }
      });

      text = `Torneo ${today}\nParticipantes:\n\n`;
      participantNames.forEach((name) => {
        text += `${name} ✅❌\n`;
      });
      text += `\nLink del torneo: https://tournamentygo-fortaleza.netlify.app/`;
    } else {
      text = `RONDA ${currentRound}\n\n`;
      currentPairings.forEach((p, index) => {
        const p1Name = p.player1.name;
        const p2Name = p.player2.name;
        // Removed scores from the copy text
        text += `${index + 1}. ${p1Name} vs ${p2Name}\n`;
      });
      text += `\nLink del torneo: https://tournamentygo-fortaleza.netlify.app/`;
    }

    navigator.clipboard.writeText(text);
    toast({ title: "¡Copiado!", description: "Los emparejamientos han sido copiados al portapapeles." });
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
    confirmText: string = "Confirmar",
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
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirm}>{confirmText}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
     )
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/80 p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-sm">
        <div className="container mx-auto flex flex-wrap items-center justify-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json,application/json"
              onChange={handleFileChange}
            />

            {status === 'registration' && renderButton(<Upload />, "Importar", handleImportClick, { variant: "outline" })}
            
            {onForceSave && renderButton(<Save />, "Guardar Estado", handleForceSave, { variant: "outline" })}

            {isJudgeView && status !== 'registration' && renderButton(<Copy />, "Copiar", handleCopy, { variant: "outline" })}

            <div className="flex-grow" />
            
            {status === 'registration' && onStart && renderButton(
                <Play />, "Iniciar Torneo", onStart, { disabled: playerCount < 2 }
            )}

            {isJudgeView && status === 'running' && !isViewingHistory && !startTime && renderButton(<PlayCircle />, "Iniciar Reloj", handleStartTimer)}

            {isJudgeView && status === 'running' && !isViewingHistory && startTime && renderButton(<StopCircle />, "Detener Reloj", handleStopTimer, { variant: "destructive" })}
            
            {status === 'running' && allResultsSubmitted && !isViewingHistory && onNextRound && !recommendedRoundsReached && renderButton(<SkipForward />, "Siguiente Ronda", onNextRound)}

            {(status === 'running' || status === 'finished') && (
                renderAlertDialogButton(
                    <RefreshCw />, "Reiniciar", "¿Estás seguro?", "Esto eliminará todos los jugadores, rondas y clasificaciones. Esta acción no se puede deshacer.", handleResetTournament, "Reiniciar", { variant: "destructive" }
                )
            )}
        </div>
    </footer>
  );
}
