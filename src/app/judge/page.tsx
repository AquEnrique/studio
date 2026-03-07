
'use client';

import { StandingsTable } from '@/components/tournament/standings-table';
import { PairingsDisplay } from '@/components/tournament/pairings-display';
import { useTournament } from '@/context/tournament-provider';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useMemo } from 'react';
import { TournamentControls } from '@/components/tournament/tournament-controls';
import { useIsMobile } from '@/hooks/use-mobile';
import { calculateStandings } from '@/context/tournament-provider';
import type { Tournament } from '@/lib/types';

export default function JudgePage() {
  const {
    tournament,
    standings,
    currentPairings,
    submitResults,
    updatePairings,
    viewingRound,
    goToRound,
    generateNextRound,
    resetTournament,
    importTournament,
    exportTournament,
    allResultsSubmitted,
    rollbackToRound,
  } = useTournament();

  const isMobile = useIsMobile();

  const currentRoundForView = viewingRound || (tournament?.rounds.length || 0);

  const isViewingHistory = viewingRound !== null && viewingRound < (tournament?.rounds.length || 0);

  const historicalStandings = useMemo(() => {
    if (!tournament || !isViewingHistory) return standings;
    const historicalTournament: Tournament = {
      ...tournament,
      rounds: tournament.rounds.slice(0, viewingRound),
    };
    return calculateStandings(historicalTournament);
  }, [tournament, viewingRound, isViewingHistory, standings]);


  if (!tournament || tournament.status === 'registration') {
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
                  onClick={() => goToRound(currentRoundForView > 1 ? currentRoundForView - 1 : 1)} 
                  disabled={currentRoundForView <= 1}
                  className="rounded-full"
              >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Ronda anterior</span>
              </Button>
              <span className="font-semibold text-sm px-2">Ronda {currentRoundForView}</span>
              <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => goToRound(currentRoundForView < tournament.rounds.length ? currentRoundForView + 1 : tournament.rounds.length)} 
                  disabled={currentRoundForView >= tournament.rounds.length && !isViewingHistory}
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
              <Alert>
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>¡Estás viendo una ronda pasada!</AlertTitle>
                  <AlertDescription>
                      Estás viendo los datos de la ronda {viewingRound}. Para editar, haz clic en "Editar Resultados", lo que eliminará todas las rondas futuras.
                  </AlertDescription>
              </Alert>
          )}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                  <h2 className="text-2xl font-semibold">Clasificaciones</h2>
                  <StandingsTable 
                      players={isViewingHistory ? historicalStandings : standings}
                      view='judge'
                      maxRounds={currentRoundForView}
                  />
              </div>
              <div>
                  <h2 className="text-2xl font-semibold mb-4">Emparejamientos - Ronda {currentRoundForView}</h2>
                  <PairingsDisplay 
                      key={currentRoundForView}
                      pairings={currentPairings}
                      submitResults={submitResults} 
                      roundNumber={currentRoundForView}
                      isEditable={tournament.status === 'running'}
                      allPlayers={tournament.players}
                      onUpdatePairings={updatePairings}
                      isViewingHistory={isViewingHistory}
                      standings={isViewingHistory ? historicalStandings : standings}
                      onRollbackRound={rollbackToRound}
                  />
              </div>
          </div>
      </main>
      <TournamentControls
        status={tournament.status}
        playerCount={tournament.players.length}
        currentRound={tournament.rounds.length}
        onNextRound={generateNextRound}
        onReset={resetTournament}
        onImport={importTournament}
        onExport={exportTournament}
        allResultsSubmitted={allResultsSubmitted}
        isMobile={isMobile}
        isViewingHistory={isViewingHistory}
      />
    </>
  );
}
