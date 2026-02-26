
'use client';

import { StandingsTable } from '@/components/tournament/standings-table';
import { PairingsDisplay } from '@/components/tournament/pairings-display';
import { useTournament, calculateStandings } from '@/context/tournament-provider';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useMemo } from 'react';
import { TournamentControls } from '@/components/tournament/tournament-controls';
import { useIsMobile } from '@/hooks/use-mobile';

export default function JudgePage() {
  const {
    state,
    submitMultipleResults,
    updatePairings,
    goToRound,
    generateNextRound,
    resetTournament,
    importTournament,
    exportTournament,
  } = useTournament();
  const isMobile = useIsMobile();

  const displayedRound = state.viewingRound || state.currentRound;

  const playersForView = useMemo(() => {
    if (state.status === 'registration') return [];
    if (state.viewingRound !== null) {
      // If viewing history, calculate standings from the historical player data
      return calculateStandings(state.history[state.viewingRound]?.players || []);
    }
    // Otherwise, use the already calculated players from the current state
    return state.players;
  }, [state.status, state.viewingRound, state.history, state.players]);

  const pairingsForView = useMemo(() => {
     if (state.status === 'registration') return [];
     return state.viewingRound !== null
      ? state.history[state.viewingRound]?.pairings || []
      : state.pairings;
  }, [state.status, state.viewingRound, state.history, state.pairings]);


  const isViewingHistory = state.viewingRound !== null && state.viewingRound < state.currentRound;

  if (state.status === 'registration') {
      return (
          <main className="flex-grow p-4 md:p-6 flex flex-col items-center justify-center text-center">
              <h1 className="text-2xl font-semibold mb-4">El torneo aún no ha comenzado.</h1>
              <p className="text-muted-foreground mb-6">Por favor, vuelve a la página principal para registrar jugadores y comenzar el torneo.</p>
              <Button asChild>
                  <Link href="/">Volver al Registro</Link>
              </Button>
          </main>
      )
  }

  return (
    <>
      <main className="flex-grow p-4 md:p-6 space-y-4 md:space-y-6 pb-24">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Vista de Juez</h1>
            <div className="flex items-center gap-2 bg-muted p-1 rounded-full">
              <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => goToRound(displayedRound > 1 ? displayedRound - 1 : 1)} 
                  disabled={displayedRound <= 1}
                  className="rounded-full"
              >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Ronda anterior</span>
              </Button>
              <span className="font-semibold text-sm px-2">Ronda {displayedRound}</span>
              <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => goToRound(displayedRound < state.currentRound ? displayedRound + 1 : state.currentRound)} 
                  disabled={displayedRound >= state.currentRound}
                  className="rounded-full"
              >
                  <ChevronRight className="h-4 w-4"/>
                  <span className="sr-only">Siguiente ronda</span>
              </Button>
              {isViewingHistory && (
                  <Button 
                      size="sm" 
                      onClick={() => goToRound(null)}
                      className="rounded-full"
                  >
                      <SkipForward className="h-4 w-4 mr-2"/>
                      Ir a Actual
                  </Button>
              )}
            </div>
          </div>
          {isViewingHistory && (
              <Alert variant="destructive">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>¡Estás viendo una ronda pasada!</AlertTitle>
                  <AlertDescription>
                      Estás viendo los datos de la ronda {displayedRound}. Cualquier resultado que ingreses hará que el torneo retroceda a este punto, eliminando todas las rondas futuras.
                  </AlertDescription>
              </Alert>
          )}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                  <h2 className="text-2xl font-semibold">Clasificaciones (Simple)</h2>
                  <StandingsTable 
                      players={playersForView} 
                      view='simple'
                      maxRounds={displayedRound}
                  />
              </div>
              <div>
                  <h2 className="text-2xl font-semibold mb-4">Emparejamientos - Ronda {displayedRound}</h2>
                  <PairingsDisplay 
                      key={displayedRound}
                      pairings={pairingsForView} 
                      submitMultipleResults={submitMultipleResults} 
                      roundNumber={displayedRound}
                      isEditable={state.status === 'running'}
                      allPlayers={state.players}
                      onUpdatePairings={updatePairings}
                      isViewingHistory={isViewingHistory}
                  />
              </div>
          </div>
      </main>
      <TournamentControls
        status={state.status}
        playerCount={state.players.length}
        currentRound={state.currentRound}
        viewingRound={state.viewingRound}
        onStart={() => {}} // Not used in judge view
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
