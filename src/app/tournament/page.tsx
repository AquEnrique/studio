
'use client';

import { PlayerRegistration } from '@/components/tournament/player-registration';
import { TournamentControls } from '@/components/tournament/tournament-controls';
import { StandingsTable } from '@/components/tournament/standings-table';
import { PairingsDisplay } from '@/components/tournament/pairings-display';
import { useTournament } from '@/hooks/use-tournament';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from 'lucide-react';

export default function TournamentPage() {
  const {
    state,
    addPlayer,
    startTournament,
    generateNextRound,
    updateMatchResult,
    resetTournament,
    goToRound,
  } = useTournament();

  const displayedRound = state.viewingRound || state.currentRound;
  const pairingsForView = state.history[displayedRound]?.pairings || state.pairings;
  const isViewingHistory = state.viewingRound !== null && state.viewingRound < state.currentRound;
  const isLatestRound = displayedRound === state.currentRound;

  return (
    <main className="flex-grow p-4 space-y-4">
      <h1 className="text-2xl font-bold">Tournament Manager</h1>
      {state.status === 'registration' && (
        <PlayerRegistration addPlayer={addPlayer} players={state.players} />
      )}

      {(state.status === 'running' || state.status === 'finished') && (
        <>
          {isViewingHistory && (
              <Alert>
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Viewing Past Round</AlertTitle>
                  <AlertDescription>
                    You are viewing pairings and results for round {displayedRound}. Editing is disabled.
                  </AlertDescription>
              </Alert>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Standings</h2>
              <StandingsTable players={state.players} />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Pairings - Round {displayedRound}</h2>
              <PairingsDisplay 
                key={displayedRound} // Re-mount component on round change to clear state
                pairings={pairingsForView} 
                updateMatchResult={updateMatchResult} 
                roundNumber={displayedRound}
                isEditable={isLatestRound}
              />
            </div>
          </div>
        </>
      )}

      <TournamentControls
        status={state.status}
        playerCount={state.players.length}
        currentRound={state.currentRound}
        viewingRound={state.viewingRound}
        onStart={startTournament}
        onNextRound={generateNextRound}
        onReset={resetTournament}
        onGoToRound={goToRound}
        allResultsSubmitted={state.allResultsSubmitted}
      />
    </main>
  );
}
