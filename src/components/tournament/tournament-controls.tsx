
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
import { Play, SkipForward, RefreshCw, Upload, Download, Gavel } from 'lucide-react';
import { useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

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
          // Trigger confirmation dialog
          onImport(content);
        } catch (error) {
           console.error("Importación fallida:", error);
           toast({ variant: "destructive", title: "Importación Fallida", description: "El archivo seleccionado no es un archivo de torneo válido." });
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

  const isViewingHistory = viewingRound !== null;

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

            {renderButton(<Upload />, "Importar", handleImportClick, { variant: "outline" })}
            {renderButton(<Download />, "Exportar", handleExport, { variant: "outline" })}
            
            <div className="flex-grow" />

            {status === 'registration' && renderButton(
                <Play />, "Iniciar Torneo", onStart, { disabled: playerCount < 2 }
            )}

            {status === 'running' && (
                <>
                  <Button asChild variant="outline">
                    <Link href="/judge">
                      <Gavel/>
                      {!isMobile && <span>Juez</span>}
                    </Link>
                  </Button>
                  {allResultsSubmitted && !isViewingHistory && renderButton(<SkipForward />, "Siguiente Ronda", onNextRound)}
                </>
            )}
            
            {(status === 'running' || status === 'finished') && (
                renderAlertDialogButton(
                    <RefreshCw />, "Reiniciar", "¿Estás seguro?", "Esto eliminará todos los jugadores, rondas y clasificaciones. Esta acción no se puede deshacer.", onReset, "Reiniciar", { variant: "destructive" }
                )
            )}
        </div>
    </footer>
  );
}
