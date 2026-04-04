
'use client';

import { useState, useEffect, useMemo, createContext, useContext, ReactNode, useRef, useCallback } from 'react';
import type { Tournament, Player, StandingsPlayer, ManualPairing, Match, Round, DisplayPairing, RoundResult } from '@/lib/types';
import { produce } from 'immer';

const NPOINT_URL = 'https://api.npoint.io/36dc4af53c22ef8f8eb5';

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
    tournament.rounds.forEach((round) => {
      if (!round || !round.matches) return;
      round.matches.forEach(match => {
        // Handle bye
        if (match.playerId2 === null) {
          if (round.status === 'finished') {
            if(playerStats[match.playerId1]) {
              playerStats[match.playerId1].points += 3;
            }
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
        if(totalGames > 0){
          playerStats[p1Id].gamesPlayed += totalGames;
          playerStats[p2Id].gamesPlayed += totalGames;
        }


        // Calculate points based on 2 game wins
        if (p1Games === 2) { // P1 wins the match
          playerStats[p1Id].points += 3;
        } else if (p2Games === 2) { // P2 wins the match
          playerStats[p2Id].points += 3;
        }
        // Otherwise, 0 points for a draw or incomplete match
      });
    });

    // Step 3: Create a map of each player's Game Win Percentage (GWP)
    const playerGwpMap = new Map<string, number>();
    tournament.players.forEach(p => {
        const stats = playerStats[p.id];
        const gwp = stats.gamesPlayed > 0 ? stats.gamesWon / stats.gamesPlayed : 0;
        playerGwpMap.set(p.id, gwp);
    });

    // Step 4: Build the final StandingsPlayer array with all tiebreakers
    const standingsPlayers: StandingsPlayer[] = tournament.players.map(p => {
        const stats = playerStats[p.id];
        
        const opponentTotalPoints = stats.opponentIds.reduce((total, oppId) => {
            return total + (playerStats[oppId]?.points || 0);
        }, 0);

        const opponentGameWinPercentagesSum = stats.opponentIds.reduce((total, oppId) => {
            // Per official Konami rules, an opponent's GWP is considered at least 33% for this calculation.
            const opponentGwp = playerGwpMap.get(oppId) || 0;
            return total + Math.max(opponentGwp, 0.33);
        }, 0);

        const opponentGameWinPercentage = stats.opponentIds.length > 0
            ? opponentGameWinPercentagesSum / stats.opponentIds.length
            : 0;

        const gameWinPercentage = playerGwpMap.get(p.id) || 0;
      
        const roundResults: RoundResult[] = tournament.rounds.map(round => {
            if (!round || !round.matches) return null;
            const match = round.matches.find(m => m.playerId1 === p.id || m.playerId2 === p.id);
            if (!match) return null;
            
            if (match.playerId2 === null && match.playerId1 === p.id) { // Check if the player is the one with the bye
                return { opponentName: 'BYE', wins: match.wonGamesPlayer1, losses: match.wonGamesPlayer2, isBye: true };
            }
            
            if (match.playerId2 === null) return null; // Not this player's bye match

            const isPlayer1 = match.playerId1 === p.id;
            const opponentId = isPlayer1 ? match.playerId2 : match.playerId1;
            const opponentName = playerMap.get(opponentId);

            return {
                opponentName: opponentName || 'Unknown',
                wins: isPlayer1 ? match.wonGamesPlayer1 : match.wonGamesPlayer2,
                losses: isPlayer1 ? match.wonGamesPlayer2 : match.wonGamesPlayer1,
                isBye: false
            };
        });

        return {
            playerId: p.id,
            playerName: playerMap.get(p.id) || 'Unknown',
            playerPoints: stats.points,
            opponentTotalPoints,
            opponentGameWinPercentage,
            gameWinPercentage,
            roundResults,
            opponentIds: stats.opponentIds,
        };
    });

    // Step 5: Sort players based on points and all tiebreakers
    standingsPlayers.sort((a, b) => {
        if (b.playerPoints !== a.playerPoints) return b.playerPoints - a.playerPoints;
        if (b.opponentTotalPoints !== a.opponentTotalPoints) return b.opponentTotalPoints - a.opponentTotalPoints;
        if (b.gameWinPercentage !== a.gameWinPercentage) return b.gameWinPercentage - a.gameWinPercentage;
        if (b.opponentGameWinPercentage !== a.opponentGameWinPercentage) return b.opponentGameWinPercentage - a.opponentGameWinPercentage;
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
    rollbackToRound: (roundIndex: number) => void;
    refreshTournament: () => Promise<void>;
    forceSaveTournament: () => Promise<boolean>;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [viewingRound, setViewingRound] = useState<number | null>(null);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const isInitialMount = useRef(true);
  const tournamentRef = useRef(tournament);
  
  useEffect(() => {
    tournamentRef.current = tournament;
  }, [tournament]);

  const fetchTournament = useCallback(async () => {
    try {
      const response = await fetch(NPOINT_URL, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data === 'object' && Object.keys(data).length > 0 && data.players && data.status && data.rounds) {
          setTournament(data);
        } else {
          // If npoint is empty or invalid, start with initial state and save it
          setTournament(initialTournamentState);
        }
      } else {
        console.error("Error fetching from npoint.io, status:", response.status);
        setTournament(initialTournamentState);
      }
    } catch (error) {
      console.error("Error fetching tournament data from npoint.io", error);
      setTournament(initialTournamentState);
    }
  }, []);

  const forceSaveTournament = useCallback(async (): Promise<boolean> => {
    if (!tournamentRef.current) return false;
    try {
        const response = await fetch(NPOINT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tournamentRef.current),
        });
        return response.ok;
    } catch (error) {
        console.error("Error saving tournament data to npoint.io", error);
        return false;
    }
  }, []);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  useEffect(() => {
    if (isInitialMount.current || !tournament) {
      if(tournament) isInitialMount.current = false;
      return;
    }
    const handler = setTimeout(() => {
      forceSaveTournament();
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [tournament, forceSaveTournament]);

  const standings = useMemo(() => {
    if (!tournament) return [];
    if (viewingRound !== null) {
        const historicalTournament: Tournament = {
            ...tournament,
            rounds: tournament.rounds.slice(0, viewingRound),
        };
        return calculateStandings(historicalTournament);
    }
    return calculateStandings(tournament);
  }, [tournament, viewingRound]);

  const addPlayer = (name: string) => {
    if (tournament?.status !== 'registration') return;
    const newPlayer: Player = {
      id: `player-${Date.now()}-${Math.random()}`,
      name,
    };
    setTournament(produce(tournament, draft => {
        if(draft) {
          draft.players.push(newPlayer);
          draft.players.sort((a,b) => a.name.localeCompare(b.name));
        }
    }));
  };
  
  const removePlayer = (id: string) => {
    if (tournament?.status !== 'registration') return;
    setTournament(produce(tournament, draft => {
      if(draft) draft.players = draft.players.filter(p => p.id !== id);
    }));
  };

  const swissPair = (players: Player[], existingRounds: Round[]): Match[] => {
    const playerStats = new Map(players.map(p => [p.id, { points: 0, opponentIds: new Set<string>() }]));

    existingRounds.forEach(round => {
        if (!round || !round.matches) return;
        round.matches.forEach(match => {
            if (match.playerId2 === null) {
                 if (round.status === 'finished') {
                    const p1Stats = playerStats.get(match.playerId1);
                    if(p1Stats) p1Stats.points += 3;
                }
            } else {
                const p1Stats = playerStats.get(match.playerId1);
                const p2Stats = playerStats.get(match.playerId2);
                if(!p1Stats || !p2Stats) return;

                p1Stats.opponentIds.add(match.playerId2);
                p2Stats.opponentIds.add(match.playerId1);

                if (match.wonGamesPlayer1 === 2) {
                    p1Stats.points += 3;
                } else if (match.wonGamesPlayer2 === 2) {
                    p2Stats.points += 3;
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

    const pairings: Match[] = [];
    
    let playersToPair = [...sortedPlayers];
    
    if (playersToPair.length % 2 !== 0) {
        let byeAssigned = false;
        // Try to assign bye to lowest ranked player who hasn't had one
        for (let i = playersToPair.length - 1; i >= 0; i--) {
            const player = playersToPair[i];
            const hasHadBye = existingRounds.some(r => r.matches.some(m => m.playerId1 === player.id && m.playerId2 === null));
            if (!hasHadBye) {
                pairings.push({ playerId1: player.id, playerId2: null, wonGamesPlayer1: 2, wonGamesPlayer2: 0, isSubmitted: true });
                playersToPair.splice(i, 1);
                byeAssigned = true;
                break;
            }
        }
        // If all remaining players had a bye, give it to the lowest ranked one.
        if (!byeAssigned && playersToPair.length > 0) {
            const byePlayer = playersToPair.pop()!;
            pairings.push({ playerId1: byePlayer.id, playerId2: null, wonGamesPlayer1: 2, wonGamesPlayer2: 0, isSubmitted: true });
        }
    }
    
    let couldn_t_pair: Player[] = [];
    
    while (playersToPair.length > 1) {
      const p1 = playersToPair.shift()!;
      let paired = false;
      for (let i = 0; i < playersToPair.length; i++) {
        const p2 = playersToPair[i];
        if (!playerStats.get(p1.id)?.opponentIds.has(p2.id)) {
          pairings.push({ playerId1: p1.id, playerId2: p2.id, wonGamesPlayer1: 0, wonGamesPlayer2: 0, isSubmitted: false });
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
      pairings.push({ playerId1: p1.id, playerId2: p2.id, wonGamesPlayer1: 0, wonGamesPlayer2: 0, isSubmitted: false });
    }
  
    return pairings;
  };
  
  const startTournament = () => {
    if (tournament?.status !== 'registration' || tournament.players.length < 2) return;
    const firstRoundMatches = swissPair(tournament.players, []);
    setTournament(produce(tournament, draft => {
        if(draft){
            draft.status = 'running';
            draft.rounds = [{ matches: firstRoundMatches, status: 'started' }];
        }
    }));
  };

  const startManualTournament = (manualPairings: ManualPairing[]) => {
    if (tournament?.status !== 'registration' || tournament.players.length < 2) return;
    const firstRoundMatches: Match[] = manualPairings.map(p => ({
        playerId1: p.player1.id,
        playerId2: p.player2.id === 'bye' ? null : p.player2.id,
        wonGamesPlayer1: p.player2.id === 'bye' ? 2 : 0,
        wonGamesPlayer2: 0,
        isSubmitted: p.player2.id === 'bye' ? true : false,
    }));
    setTournament(produce(tournament, draft => {
        if (draft) {
            draft.status = 'running';
            draft.rounds = [{ matches: firstRoundMatches, status: 'started' }];
        }
    }));
  };
  
  const generateNextRound = () => {
    if (!tournament || tournament?.status !== 'running') return;
    
    const newTournament = produce(tournament, draft => {
      if (!draft) return;
      const newRoundMatches = swissPair(draft.players, draft.rounds);
      draft.rounds.push({ matches: newRoundMatches, status: 'started' });
    });

    setTournament(newTournament);
    setViewingRound(null);

    // Immediately and automatically save the tournament state when generating a new round
    fetch(NPOINT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTournament),
    }).catch(error => {
        console.error("Error automatically saving tournament on next round:", error);
    });
  };
  
  const submitResults = (roundIndex: number, results: ResultInput[]) => {
      if (!tournament) return;
      
      setTournament(produce(draft => {
          if(!draft) return;
          
          if (roundIndex < draft.rounds.length - 1) {
            draft.rounds.length = roundIndex + 1;
          }

          const roundToUpdate = draft.rounds[roundIndex];
          if(!roundToUpdate) return;

          results.forEach(result => {
              const match = roundToUpdate.matches.find(m => m.playerId1 === result.p1Id && (m.playerId2 === result.p2Id || m.playerId2 === null));
              if (match) {
                  match.wonGamesPlayer1 = result.p1Games;
                  match.wonGamesPlayer2 = result.p2Games;
                  match.isSubmitted = true;
              }
          });

          const allSubmitted = roundToUpdate.matches.every(m => m.isSubmitted);

          if(allSubmitted) {
            roundToUpdate.status = 'finished';
          }
      }));

      if(viewingRound !== null) {
          setViewingRound(null);
      }
  };
  
    const updatePairings = (newPairings: ManualPairing[]) => {
        if (!tournament || tournament.status !== 'running') return;
        const currentRoundIndex = viewingRound ? viewingRound - 1 : tournament.rounds.length - 1;

        const newRoundMatches: Match[] = newPairings.map(p => ({
            playerId1: p.player1.id,
            playerId2: p.player2.id === 'bye' ? null : p.player2.id,
            wonGamesPlayer1: p.player2.id === 'bye' ? 2 : 0,
            wonGamesPlayer2: 0,
            isSubmitted: p.player2.id === 'bye'
        }));

        setTournament(produce(tournament, draft => {
            if(draft) {
              if (currentRoundIndex < draft.rounds.length - 1) {
                  draft.rounds.length = currentRoundIndex + 1;
              }
              draft.rounds[currentRoundIndex] = { matches: newRoundMatches, status: 'started' };
            }
        }));
        
        if (viewingRound !== null) {
          setViewingRound(null);
        }
    };

  const goToRound = (round: number | null) => {
    setViewingRound(round);
  };

  const resetTournament = () => {
    setTournament(produce(draft => {
      if (!draft) return;
      // Keep players, reset everything else
      draft.rounds = [];
      draft.status = 'registration';
    }));
    setViewingRound(null);
  };

  const exportTournament = (): string => {
    if (!tournament) return JSON.stringify(initialTournamentState, null, 2);
    return JSON.stringify(tournament, null, 2);
  };

  const importTournament = (fileContent: string) => {
    setPendingImport(fileContent);
  };

  const confirmImport = () => {
    if (pendingImport) {
      try {
        const loadedTournament = JSON.parse(pendingImport);
        // Basic validation
        if (loadedTournament.players && loadedTournament.status && loadedTournament.rounds) {
          setTournament(loadedTournament);
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

  const rollbackToRound = (roundIndex: number) => {
    setTournament(produce(draft => {
        if (!draft || roundIndex < 0 || roundIndex >= draft.rounds.length) return;

        // Truncate future rounds
        draft.rounds.length = roundIndex + 1;

        const roundToEdit = draft.rounds[roundIndex];
        if (!roundToEdit) return;

        // Change round status
        roundToEdit.status = 'started';

        // Reset matches in that round
        roundToEdit.matches.forEach(match => {
            if (match.playerId2 !== null) { // Don't reset bye matches scores, just submitted status
                match.wonGamesPlayer1 = 0;
                match.wonGamesPlayer2 = 0;
            }
            match.isSubmitted = match.playerId2 === null;
        });
    }));
    setViewingRound(null);
  };

  const refreshTournament = useCallback(async () => {
    await fetchTournament();
  }, [fetchTournament]);

  const currentPairings = useMemo((): DisplayPairing[] => {
    if (!tournament) return [];
    
    // If not running, return empty.
    if(tournament.status !== 'running' && tournament.status !== 'finished') return [];
    
    // Determine which round to display. If viewingRound is set, use it, otherwise use the latest round.
    const roundNumberForView = viewingRound || tournament.rounds.length;
    const roundIndex = roundNumberForView - 1;

    // If no valid round index, return empty.
    if (roundIndex < 0 || roundIndex >= tournament.rounds.length) return [];
    
    const roundToDisplay = tournament.rounds[roundIndex];

    if (!roundToDisplay || !roundToDisplay.matches) return [];

    const playerMap = new Map(tournament.players.map(p => [p.id, p]));

    return roundToDisplay.matches.map(match => {
        const p1 = playerMap.get(match.playerId1);
        if (!p1) return null;

        const p2 = match.playerId2 ? playerMap.get(match.playerId2) : null;
        
        const isSubmitted = !!match.isSubmitted;

        return {
            player1: p1,
            player2: p2 ? p2 : { id: 'bye', name: 'BYE' },
            isSubmitted: isSubmitted,
            result: {
                p1Games: match.wonGamesPlayer1.toString(),
                p2Games: match.wonGamesPlayer2.toString(),
            }
        };
    }).filter((p): p is DisplayPairing => p !== null);

  }, [tournament, viewingRound]);

  const allResultsSubmitted = useMemo(() => {
    if (!tournament || tournament.status !== 'running' || tournament.rounds.length === 0) return false;
    const currentRound = tournament.rounds[tournament.rounds.length - 1];
    if (!currentRound) return false; // Should not happen if rounds.length > 0
    return currentRound.status === 'finished';
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
    rollbackToRound,
    refreshTournament,
    forceSaveTournament,
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
