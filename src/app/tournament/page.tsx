
'use client';

import { PlayerRegistration } from '@/components/tournament/player-registration';
import { TournamentControls } from '@/components/tournament/tournament-controls';
import { StandingsTable } from '@/components/tournament/standings-table';
import { PairingsDisplay } from '@/components/tournament/pairings-display';
import { useTournament } from '@/hooks/use-tournament';

export default function TournamentPage() {
  const {
    state,
    addPlayer,
    startTournament,
    generateNextRound,
    updateMatchResult,
    resetTournament,
  } = useTournament();

  return (
    <main className="flex-grow p-4 space-y-4">
      <h1 className="text-2xl font-bold">Tournament Manager</h1>
      {state.status === 'registration' && (
        <PlayerRegistration addPlayer={addPlayer} players={state.players} />
      )}

      {(state.status === 'running' || state.status === 'finished') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Standings</h2>
            <StandingsTable players={state.players} />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Pairings - Round {state.currentRound}</h2>
            <PairingsDisplay pairings={state.pairings} updateMatchResult={updateMatchResult} />
          </div>
        </div>
      )}

      <TournamentControls
        status={state.status}
        playerCount={state.players.length}
        onStart={startTournament}
        onNextRound={generateNextRound}
        onReset={resetTournament}
      />
    </main>
  );
}
