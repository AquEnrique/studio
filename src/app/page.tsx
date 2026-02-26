
'use client';

import { useState } from 'react';
import { PlayerRegistration } from '@/components/tournament/player-registration';
import { TournamentControls } from '@/components/tournament/tournament-controls';
import { StandingsTable } from '@/components/tournament/standings-table';
import { useTournament } from '@/hooks/use-tournament';
import { List, BarChart } from 'lucide-react';
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
    state,
    pendingImport,
    addPlayer,
    removePlayer,
    startTournament,
    startManualTournament,
    generateNextRound,
    resetTournament,
    goToRound,
    importTournament,
    exportTournament,
    confirmImport,
    cancelImport,
  } = useTournament();
  
  const [standingsView, setStandingsView] = useState<'simple' | 'advanced'>('simple');
  const isMobile = useIsMobile();


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
        {state.status === 'registration' && (
          <PlayerRegistration 
            addPlayer={addPlayer} 
            removePlayer={removePlayer}
            players={state.players} 
            startManualTournament={startManualTournament}
          />
        )}

        {(state.status === 'running' || state.status === 'finished') && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Clasificaciones</h2>
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
              players={state.players} 
              view={standingsView} 
              maxRounds={state.currentRound}
            />
          </div>
        )}
      </main>
      <TournamentControls
        status={state.status}
        playerCount={state.players.length}
        currentRound={state.currentRound}
        viewingRound={state.viewingRound}
        onStart={startTournament}
        onNextRound={generateNextRound}
        onReset={resetTournament}
        onGoToRound={goToRound}
        onImport={importTournament}
        onExport={exportTournament}
        allResultsSubmitted={state.allResultsSubmitted}
        isMobile={isMobile}
      />
    </>
  );
}
