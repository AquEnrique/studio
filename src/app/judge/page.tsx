'use client';

import { StandingsTable } from '@/components/tournament/standings-table';
import { PairingsDisplay } from '@/components/tournament/pairings-display';
import { useTournament } from '@/hooks/use-tournament';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function JudgePage() {
  const {
    state,
    updateMatchResult,
    updatePairings,
  } = useTournament();

  const displayedRound = state.viewingRound || state.currentRound;
  const pairingsForView = state.status === 'running' && state.history[displayedRound] 
    ? state.history[displayedRound].pairings 
    : state.pairings;
  const isViewingHistory = state.viewingRound !== null && state.viewingRound < state.currentRound;
  const isLatestRound = displayedRound === state.currentRound && !isViewingHistory;

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
    <main className="flex-grow p-4 md:p-6 space-y-4 md:space-y-6 pb-24">
        <h1 className="text-3xl font-bold tracking-tight">Vista de Juez</h1>
        {isViewingHistory && (
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Viendo una Ronda Pasada</AlertTitle>
                <AlertDescription>
                    Estás viendo los emparejamientos y resultados de la ronda {displayedRound}. La edición está desactivada.
                </AlertDescription>
            </Alert>
        )}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
                <h2 className="text-2xl font-semibold">Clasificaciones (Simple)</h2>
                <StandingsTable 
                    players={state.players} 
                    view='simple'
                    maxRounds={state.currentRound}
                />
            </div>
            <div>
                <h2 className="text-2xl font-semibold mb-4">Emparejamientos - Ronda {displayedRound}</h2>
                <PairingsDisplay 
                    key={displayedRound}
                    pairings={pairingsForView} 
                    updateMatchResult={updateMatchResult} 
                    roundNumber={displayedRound}
                    isEditable={isLatestRound}
                    allPlayers={state.players}
                    onUpdatePairings={updatePairings}
                />
            </div>
        </div>
    </main>
  );
}
