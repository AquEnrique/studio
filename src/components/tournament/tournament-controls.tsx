
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
import { Play, SkipForward, RefreshCw, Upload, Download, PlayCircle } from 'lucide-react';
import { useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useClock } from '@/context/clock-provider';

interface TournamentControlsProps {
  status: 'registration' | 'running' | 'finished';
  playerCount: number;
  onStart?: () => void;
  onNextRound?: () => void;
  onReset: () => void;
  onImport: (fileContent: string) => void;
  onExport: () => string;
  isMobile: boolean;
  allResultsSubmitted?: boolean;
  isViewingHistory?: boolean;
  currentRound?: number;
  isJudgeView?: boolean;
}

export function TournamentControls({
  status,
  playerCount,
  onStart,
  onNextRound,
  onReset,
  onImport,
  onExport,
  isMobile,
  allResultsSubmitted,
  isViewingHistory,
  isJudgeView,
}: TournamentControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { startRoundTimer, resetRoundTimer, requestNotificationPermission, startTime } = useClock();

  const handleStartTimer = () => {
    requestNotificationPermission();
    startRoundTimer();
    toast({ title: "¡Ronda iniciada!", description: "El reloj de 50 minutos ha comenzado." });
  }

  const handleResetTournament = () => {
    resetRoundTimer();
    onReset();
  }

  const handleExport = () => {
    try {
      const tournamentJson = onExport();
      const blob = new Blob([tournamentJson], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tournament-export-${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Éxito", description: "Datos del torneo exportados correctamente." });
    } catch (error) {
      console.error("Exportación fallida:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron exportar los datos del torneo." });
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
    <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-2 z-10">
        <div className="container mx-auto flex items-center justify-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json,application/json"
              onChange={handleFileChange}
            />

            {status === 'registration' && renderButton(<Upload />, "Importar", handleImportClick, { variant: "outline" })}
            <Button variant="outline" onClick={handleExport}>
                <Download />
                {!isMobile && <span>Exportar</span>}
            </Button>
            
            <div className="flex-grow" />

            {status === 'registration' && onStart && renderButton(
                <Play />, "Iniciar Torneo", onStart, { disabled: playerCount < 2 }
            )}

            {isJudgeView && status === 'running' && !isViewingHistory && !startTime && renderButton(<PlayCircle />, "Iniciar Reloj", handleStartTimer)}
            
            {status === 'running' && allResultsSubmitted && !isViewingHistory && onNextRound && renderButton(<SkipForward />, "Siguiente Ronda", onNextRound)}
            
            {(status === 'running' || status === 'finished') && (
                renderAlertDialogButton(
                    <RefreshCw />, "Reiniciar", "¿Estás seguro?", "Esto eliminará todos los jugadores, rondas y clasificaciones. Esta acción no se puede deshacer.", handleResetTournament, "Reiniciar", { variant: "destructive" }
                )
            )}
        </div>
    </footer>
  );
}
