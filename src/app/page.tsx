
'use client';

import { useState } from 'react';
import { PlayerRegistration } from '@/components/tournament/player-registration';
import { TournamentControls } from '@/components/tournament/tournament-controls';
import { StandingsTable } from '@/components/tournament/standings-table';
import { useTournament } from '@/context/tournament-provider';
import { List, BarChart, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


export default function TournamentPage() {
  const {
    tournament,
    standings,
    pendingImport,
    addPlayer,
    removePlayer,
    startTournament,
    startManualTournament,
    resetTournament,
    importTournament,
    exportTournament,
    confirmImport,
    cancelImport,
    refreshTournament,
  } = useTournament();
  
  const [standingsView, setStandingsView] = useState<'simple' | 'advanced'>('simple');
  const isMobile = useIsMobile();

  if (!tournament) {
    return null; // Or a loading indicator
  }

  return (
    <>
       <AlertDialog open={!!pendingImport}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres importar?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto sobrescribirá el torneo actual. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelImport}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>Importar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="flex-grow p-4 md:p-6 space-y-4 md:space-y-6 pb-24">
        <h1 className="text-3xl font-bold tracking-tight">Tournament Manager</h1>
        {tournament.status === 'registration' && (
          <PlayerRegistration 
            addPlayer={addPlayer} 
            removePlayer={removePlayer}
            players={tournament.players} 
            startManualTournament={startManualTournament}
          />
        )}

        {(tournament.status === 'running' || tournament.status === 'finished') && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold">Clasificaciones</h2>
                  <Button variant="outline" size="icon" onClick={() => refreshTournament()} className="h-8 w-8">
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Actualizar tabla</span>
                  </Button>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-muted p-1">
                  <Button 
                      variant={standingsView === 'simple' ? 'secondary' : 'ghost'} 
                      size="sm" 
                      onClick={() => setStandingsView('simple')}
                      className="rounded-full gap-2"
                  >
                      <List className="w-4 h-4"/>
                      Simple
                  </Button>
                  <Button 
                      variant={standingsView === 'advanced' ? 'secondary' : 'ghost'} 
                      size="sm" 
                      onClick={() => setStandingsView('advanced')}
                      className="rounded-full gap-2"
                  >
                      <BarChart className="w-4 h-4"/>
                      Avanzada
                  </Button>
              </div>
            </div>
            <StandingsTable 
              players={standings} 
              view={standingsView} 
              maxRounds={tournament.rounds.length}
            />
          </div>
        )}
      </main>
      {tournament.status === 'registration' && (
        <TournamentControls
          status={tournament.status}
          playerCount={tournament.players.length}
          onStart={startTournament}
          onReset={resetTournament}
          onImport={importTournament}
          onExport={exportTournament}
          isMobile={isMobile}
        />
      )}
    </>
  );
}
