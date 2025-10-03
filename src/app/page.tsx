
'use client';

import { useState } from 'react';
import { PlayerRegistration } from '@/components/tournament/player-registration';
import { TournamentControls } from '@/components/tournament/tournament-controls';
import { StandingsTable } from '@/components/tournament/standings-table';
import { PairingsDisplay } from '@/components/tournament/pairings-display';
import { useTournament } from '@/hooks/use-tournament';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, List, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

export default function TournamentPage() {
  const {
    state,
    addPlayer,
    removePlayer,
    startTournament,
    generateNextRound,
    updateMatchResult,
    resetTournament,
    goToRound,
  } = useTournament();
  
  const [standingsView, setStandingsView] = useState<'simple' | 'advanced'>('simple');
  const isMobile = useIsMobile();

  const displayedRound = state.viewingRound || state.currentRound;
  const pairingsForView = state.status === 'running' && state.history[displayedRound] 
    ? state.history[displayedRound].pairings 
    : state.pairings;
  const isViewingHistory = state.viewingRound !== null && state.viewingRound < state.currentRound;
  const isLatestRound = displayedRound === state.currentRound && !isViewingHistory;


  return (
    <>
      <main className="flex-grow p-4 md:p-6 space-y-4 md:space-y-6 pb-24">
        <h1 className="text-3xl font-bold tracking-tight">Tournament Manager</h1>
        {state.status === 'registration' && (
          <PlayerRegistration 
            addPlayer={addPlayer} 
            removePlayer={removePlayer}
            players={state.players} 
          />
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Standings</h2>
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
                          Advanced
                      </Button>
                  </div>
                </div>
                <StandingsTable 
                  players={state.players} 
                  view={standingsView} 
                  maxRounds={state.currentRound}
                />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-4">Pairings - Round {displayedRound}</h2>
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
        allResultsSubmitted={state.allResultsSubmitted}
        isMobile={isMobile}
      />
    </>
  );
}
