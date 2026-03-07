
'use client';

import { useState, useEffect, useMemo, createContext, useContext, ReactNode } from 'react';
import type { Tournament, Player, StandingsPlayer, ManualPairing, Match, Round, DisplayPairing, RoundResult } from '@/lib/types';
import { produce } from 'immer';

const LOCAL_STORAGE_KEY = 'ygo-tournament-state-v2';

const initialTournamentState: Tournament = {
  players: [],
  rounds: [],
  status: 'registration',
};

// Helper to calculate standings from the tournament state
export const calculateStandings = (tournament: Tournament | null): StandingsPlayer[] => {
    if (!tournament || !tournament.players.length) return [];
    
    // Step 1: Initialize stats for each player
    const playerStats: { [key: string]: { 
        points: number, 
        opponentIds: string[],
        gamesWon: number,
        gamesPlayed: number
    } } = {};
    const playerMap = new Map(tournament.players.map(p => [p.id, p.name]));

    tournament.players.forEach(p => {
      playerStats[p.id] = { points: 0, opponentIds: [], gamesWon: 0, gamesPlayed: 0 };
    });

    // Step 2: Iterate through rounds and matches to calculate base stats
    tournament.rounds.forEach(round => {
      round.forEach(match => {
        // Handle bye: 3 points, no games played
        if (match.playerId2 === null) {
          if(playerStats[match.playerId1]) {
            playerStats[match.playerId1].points += 3;
          }
          return;
        }

        const p1Id = match.playerId1;
        const p2Id = match.playerId2;
        
        if (!playerStats[p1Id] || !playerStats[p2Id]) return;

        // Add opponents for OTP calculation later
        playerStats[p1Id].opponentIds.push(p2Id);
        playerStats[p2Id].opponentIds.push(p1Id);
        
        // Accumulate games won and played for GW%
        const p1Games = match.wonGamesPlayer1;
        const p2Games = match.wonGamesPlayer2;
        playerStats[p1Id].gamesWon += p1Games;
        playerStats[p2Id].gamesWon += p2Games;
        const totalGames = p1Games + p2Games;
        playerStats[p1Id].gamesPlayed += totalGames;
        playerStats[p2Id].gamesPlayed += totalGames;

        // Calculate points based on 2 game wins
        if (p1Games === 2) { // P1 wins the match
          playerStats[p1Id].points += 3;
        } else if (p2Games === 2) { // P2 wins the match
          playerStats[p2Id].points += 3;
        }
        // Otherwise, 0 points for a draw or incomplete match
      });
    });

    // Step 3: Calculate opponent total points (OTP)
    const opponentTotalPoints: { [key: string]: number } = {};
    tournament.players.forEach(p => {
      opponentTotalPoints[p.id] = playerStats[p.id].opponentIds.reduce((total, oppId) => {
        return total + (playerStats[oppId]?.points || 0);
      }, 0);
    });

    // Step 4: Build the final StandingsPlayer array
    const standingsPlayers: StandingsPlayer[] = tournament.players.map(p => {
      const stats = playerStats[p.id];
      
      const gameWinPercentage = stats.gamesPlayed > 0 
        ? stats.gamesWon / stats.gamesPlayed 
        : 0;
      
      const roundResults: RoundResult[] = tournament.rounds.map(round => {
          const match = round.find(m => m.playerId1 === p.id || m.playerId2 === p.id);
          if (!match) return null;
          
          if (match.playerId2 === null && match.playerId1 === p.id) { // Check if the player is the one with the bye
              return { opponentName: 'BYE', wins: match.wonGamesPlayer1, losses: match.wonGamesPlayer2, isBye: true };
          }
          
          if (match.playerId2 === null) return null; // Not this player's bye match

          const isPlayer1 = match.playerId1 === p.id;
          const opponentId = isPlayer1 ? match.playerId2 : match.playerId1;
          const opponent = playerMap.get(opponentId);

          return {
            opponentName: opponent?.name || 'Unknown',
            wins: isPlayer1 ? match.wonGamesPlayer1 : match.wonGamesPlayer2,
            losses: isPlayer1 ? match.wonGamesPlayer2 : match.wonGamesPlayer1,
            isBye: false
          };
      });

      return {
        playerId: p.id,
        playerName: playerMap.get(p.id) || 'Unknown',
        playerPoints: stats.points,
        opponentTotalPoints: opponentTotalPoints[p.id],
        gameWinPercentage,
        roundResults,
      };
    });

    // Step 5: Sort players based on points and tiebreakers
    standingsPlayers.sort((a, b) => {
        if (b.playerPoints !== a.playerPoints) return b.playerPoints - a.playerPoints;
        if (b.opponentTotalPoints !== a.opponentTotalPoints) return b.opponentTotalPoints - a.opponentTotalPoints;
        if (b.gameWinPercentage !== a.gameWinPercentage) return b.gameWinPercentage - a.gameWinPercentage;
        return Math.random() - 0.5; // Random tiebreaker at the end
    });

    return standingsPlayers;
};

type ResultInput = { p1Id: string; p2Id: string | null; p1Games: number; p2Games: number };

interface TournamentContextType {
    tournament: Tournament | null;
    standings: StandingsPlayer[];
    currentPairings: DisplayPairing[];
    addPlayer: (name: string) => void;
    removePlayer: (id: string) => void;
    startTournament: () => void;
    startManualTournament: (pairings: ManualPairing[]) => void;
    generateNextRound: () => void;
    submitResults: (roundIndex: number, results: ResultInput[]) => void;
    updatePairings: (newPairings: ManualPairing[]) => void;
    resetTournament: () => void;
    viewingRound: number | null;
    goToRound: (round: number | null) => void;
    exportTournament: () => string;
    importTournament: (fileContent: string) => void;
    pendingImport: string | null;
    confirmImport: () => void;
    cancelImport: () => void;
    allResultsSubmitted: boolean;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [viewingRound, setViewingRound] = useState<number | null>(null);
  const [pendingImport, setPendingImport] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedState = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedState) {
        setTournament(JSON.parse(savedState));
      } else {
        setTournament(initialTournamentState);
      }
    } catch (error) {
      console.error("Error loading state from localStorage", error);
      setTournament(initialTournamentState);
    }
  }, []);

  useEffect(() => {
    if (tournament) {
        try {
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tournament));
        } catch (error) {
            console.error("Error saving state to localStorage", error);
        }
    }
  }, [tournament]);

  const standings = useMemo(() => calculateStandings(tournament), [tournament]);

  const addPlayer = (name: string) => {
    if (tournament?.status !== 'registration') return;
    const newPlayer: Player = {
      id: `player-${Date.now()}-${Math.random()}`,
      name,
    };
    setTournament(produce(tournament, draft => {
        if(draft) draft.players.push(newPlayer);
    }));
  };
  
  const removePlayer = (id: string) => {
    if (tournament?.status !== 'registration') return;
    setTournament(produce(tournament, draft => {
      if(draft) draft.players = draft.players.filter(p => p.id !== id);
    }));
  };

  const swissPair = (players: Player[], existingRounds: Round[]): Round => {
    const playerStats = new Map(players.map(p => [p.id, { points: 0, opponentIds: new Set<string>() }]));

    existingRounds.forEach(round => {
        round.forEach(match => {
            if (match.playerId2 === null) {
                const p1Stats = playerStats.get(match.playerId1);
                if(p1Stats) p1Stats.points += 3;
            } else {
                const p1Stats = playerStats.get(match.playerId1);
                const p2Stats = playerStats.get(match.playerId2);
                if(!p1Stats || !p2Stats) return;

                p1Stats.opponentIds.add(match.playerId2);
                p2Stats.opponentIds.add(match.playerId1);

                if (match.wonGamesPlayer1 > match.wonGamesPlayer2) {
                    p1Stats.points += 3;
                } else if (match.wonGamesPlayer2 > match.wonGamesPlayer1) {
                    p2Stats.points += 3;
                } else {
                    p1Stats.points += 1;
                    p2Stats.points += 1;
                }
            }
        });
    });
    
    let sortedPlayers = [...players].sort((a, b) => {
        const pointsA = playerStats.get(a.id)?.points || 0;
        const pointsB = playerStats.get(b.id)?.points || 0;
        if(pointsB !== pointsA) return pointsB - pointsA;
        return Math.random() - 0.5;
    });

    const pairings: Round = [];
    const pairedPlayerIds = new Set<string>();

    if (sortedPlayers.length % 2 !== 0) {
        const byePlayer = sortedPlayers.pop()!;
        pairings.push({ playerId1: byePlayer.id, playerId2: null, wonGamesPlayer1: 2, wonGamesPlayer2: 0 });
        pairedPlayerIds.add(byePlayer.id);
    }
    
    let playersToPair = [...sortedPlayers];
    let couldn_t_pair: Player[] = [];
    
    while (playersToPair.length > 1) {
      const p1 = playersToPair.shift()!;
      let paired = false;
      for (let i = 0; i < playersToPair.length; i++) {
        const p2 = playersToPair[i];
        if (!playerStats.get(p1.id)?.opponentIds.has(p2.id)) {
          pairings.push({ playerId1: p1.id, playerId2: p2.id, wonGamesPlayer1: 0, wonGamesPlayer2: 0 });
          playersToPair.splice(i, 1);
          paired = true;
          break;
        }
      }
      if (!paired) {
        couldn_t_pair.push(p1);
      }
    }

    playersToPair = [...couldn_t_pair, ...playersToPair];
    
    while(playersToPair.length > 1) {
      const p1 = playersToPair.shift()!;
      const p2 = playersToPair.shift()!;
      console.warn(`Could not find a valid opponent for ${p1.name}. Forcing a rematch with ${p2.name}.`);
      pairings.push({ playerId1: p1.id, playerId2: p2.id, wonGamesPlayer1: 0, wonGamesPlayer2: 0 });
    }
  
    return pairings;
  };
  
  const startTournament = () => {
    if (tournament?.status !== 'registration' || tournament.players.length < 2) return;
    const firstRound = swissPair(tournament.players, []);
    setTournament(produce(tournament, draft => {
        if(draft){
            draft.status = 'running';
            draft.rounds = [firstRound];
        }
    }));
  };

  const startManualTournament = (manualPairings: ManualPairing[]) => {
    if (tournament?.status !== 'registration' || tournament.players.length < 2) return;
    const firstRound: Round = manualPairings.map(p => ({
        playerId1: p.player1.id,
        playerId2: p.player2.id === 'bye' ? null : p.player2.id,
        wonGamesPlayer1: p.player2.id === 'bye' ? 2 : 0,
        wonGamesPlayer2: 0,
    }));
    setTournament(produce(tournament, draft => {
        if (draft) {
            draft.status = 'running';
            draft.rounds = [firstRound];
        }
    }));
  };
  
  const generateNextRound = () => {
    if (tournament?.status !== 'running') return;

    setTournament(produce(draft => {
      if (!draft) return;
      // Before generating next round, ensure the previous round's byes are correctly marked
      const lastRoundIndex = draft.rounds.length - 1;
      if (lastRoundIndex >= 0) {
        const lastRound = draft.rounds[lastRoundIndex];
        lastRound.forEach(match => {
          if (match.playerId2 === null) {
            match.wonGamesPlayer1 = 2; // Bye is an automatic 2-0 win
            match.wonGamesPlayer2 = 0;
          }
        });
      }
      const newRound = swissPair(draft.players, draft.rounds);
      draft.rounds.push(newRound);
    }));
    setViewingRound(null);
  };
  
  const submitResults = (roundIndex: number, results: ResultInput[]) => {
      if (!tournament) return;
      setTournament(produce(tournament, draft => {
          if(!draft) return;
          
          if(roundIndex < draft.rounds.length - 1) {
            // Keep a copy of the round we are about to modify
            const originalRound = JSON.parse(JSON.stringify(draft.rounds[roundIndex]));
            
            // Rollback state to the beginning of the edited round
            draft.rounds = draft.rounds.slice(0, roundIndex);
            draft.rounds.push(originalRound);
          }

          const currentRound = draft.rounds[roundIndex];
          if(!currentRound) return;

          results.forEach(result => {
              const matchIndex = currentRound.findIndex(m => m.playerId1 === result.p1Id && m.playerId2 === result.p2Id);
              if (matchIndex !== -1) {
                  currentRound[matchIndex].wonGamesPlayer1 = result.p1Games;
                  currentRound[matchIndex].wonGamesPlayer2 = result.p2Games;
              }
          });
      }));
      setViewingRound(null);
  };
  
    const updatePairings = (newPairings: ManualPairing[]) => {
        if (!tournament || tournament.status !== 'running') return;
        const currentRoundIndex = tournament.rounds.length - 1;
        const newRound: Round = newPairings.map(p => ({
            playerId1: p.player1.id,
            playerId2: p.player2.id === 'bye' ? null : p.player2.id,
            wonGamesPlayer1: p.player2.id === 'bye' ? 2 : 0,
            wonGamesPlayer2: 0
        }));

        setTournament(produce(tournament, draft => {
            if(draft) draft.rounds[currentRoundIndex] = newRound;
        }));
    };

  const goToRound = (round: number | null) => {
    setViewingRound(round);
  };

  const resetTournament = () => {
    setTournament(initialTournamentState);
    setViewingRound(null);
     try {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing state from localStorage", error);
    }
  };

  const exportTournament = (): string => {
    return JSON.stringify(tournament, null, 2);
  };

  const importTournament = (fileContent: string) => {
    setPendingImport(fileContent);
  };

  const confirmImport = () => {
    if (pendingImport) {
      try {
        const newState = JSON.parse(pendingImport);
        // Basic validation
        if (newState.players && newState.status && newState.rounds) {
          setTournament(newState);
          setViewingRound(null);
        } else {
          throw new Error("Invalid tournament file structure.");
        }
      } catch (e) {
        console.error("Failed to parse imported file:", e);
      } finally {
        setPendingImport(null);
      }
    }
  };

  const cancelImport = () => {
    setPendingImport(null);
  };

  const currentPairings = useMemo((): DisplayPairing[] => {
    if (!tournament || tournament.status !== 'running') return [];
    
    const roundForView = viewingRound || tournament.rounds.length;
    const roundIndex = roundForView - 1;

    if (roundIndex < 0 || roundIndex >= tournament.rounds.length) return [];
    
    const currentRound = tournament.rounds[roundIndex];
    if (!currentRound) return [];

    const playerMap = new Map(tournament.players.map(p => [p.id, p]));

    const isHistory = viewingRound !== null && viewingRound < tournament.rounds.length;

    return currentRound.map(match => {
        const p1 = playerMap.get(match.playerId1);
        if (!p1) return null; // Should not happen

        const p2 = match.playerId2 ? playerMap.get(match.playerId2) : null;
        
        const totalGames = match.wonGamesPlayer1 + match.wonGamesPlayer2;
        const isSubmitted = totalGames > 0 || match.playerId2 === null;

        return {
            player1: p1,
            player2: p2 ? p2 : { id: 'bye', name: 'BYE' },
            isSubmitted: !isHistory && isSubmitted,
            result: {
                p1Games: match.wonGamesPlayer1.toString(),
                p2Games: match.wonGamesPlayer2.toString(),
            }
        };
    }).filter((p): p is DisplayPairing => p !== null);

  }, [tournament, viewingRound]);

  const allResultsSubmitted = useMemo(() => {
    if (!tournament || tournament.status !== 'running') return false;
    const currentRound = tournament.rounds[tournament.rounds.length - 1];
    if (!currentRound) return true;
    return currentRound.every(match => {
        if (match.playerId2 === null) return true; // Byes are auto-submitted
        const p1Wins = match.wonGamesPlayer1;
        const p2Wins = match.wonGamesPlayer2;
        return p1Wins === 2 || p2Wins === 2 || (p1Wins === 1 && p2Wins === 1);
    });
  }, [tournament]);


  const value: TournamentContextType = {
    tournament,
    standings,
    currentPairings,
    addPlayer,
    removePlayer,
    startTournament,
    startManualTournament,
    generateNextRound,
    submitResults,
    updatePairings,
    resetTournament,
    viewingRound,
    goToRound,
    exportTournament,
    importTournament,
    pendingImport,
    confirmImport,
    cancelImport,
    allResultsSubmitted,
  };

  return (
      <TournamentContext.Provider value={value}>
          {children}
      </TournamentContext.Provider>
  );
}

export const useTournament = (): TournamentContextType => {
    const context = useContext(TournamentContext);
    if (context === undefined) {
        throw new Error('useTournament must be used within a TournamentProvider');
    }
    return context;
};
