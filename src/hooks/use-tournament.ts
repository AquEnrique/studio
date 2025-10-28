
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TournamentState, Player, Pairing, StandingsPlayer, ManualPairing } from '@/lib/types';
import { produce } from 'immer';

const initialTournamentState: TournamentState = {
  players: [],
  currentRound: 0,
  pairings: [],
  status: 'registration',
  history: {},
  viewingRound: null,
};

const TOURNAMENT_STORAGE_KEY = 'ygo-tournament-state';

// Helper to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}


export function useTournament() {
  const [state, setState] = useState<TournamentState>(initialTournamentState);
  const [pendingImport, setPendingImport] = useState<string | null>(null);

  // Load state from local storage on initial render
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(TOURNAMENT_STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Basic validation
        if (parsedState.players && parsedState.status) {
           setState(parsedState);
        }
      }
    } catch (error) {
      console.error("Failed to load tournament state from localStorage", error);
    }
  }, []);

  // Save state to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(TOURNAMENT_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save tournament state to localStorage", error);
    }
  }, [state]);

  const addPlayer = (name: string) => {
    if (state.status !== 'registration') return;
    const newPlayer: Player = {
      id: `player-${Date.now()}-${Math.random()}`,
      name,
      points: 0,
      matches: [],
      opponentIds: [],
      gameWins: 0,
      gamesPlayed: 0,
    };
    const newState = produce(state, draft => {
        draft.players.push(newPlayer);
    });
    setState(newState);
  };
  
  const removePlayer = (id: string) => {
    if (state.status !== 'registration') return;
    setState(produce(draft => {
      draft.players = draft.players.filter(p => p.id !== id);
    }));
  };

  const generatePairings = (players: Player[], round: number): Pairing[] => {
    let sortedPlayers: StandingsPlayer[];
    if (round === 1) {
        sortedPlayers = shuffleArray(calculateStandings(players));
    } else {
      sortedPlayers = calculateStandings(players);
    }
  
    const pairings: Pairing[] = [];
    let availablePlayers = [...sortedPlayers];
  
    // Handle bye for odd number of players
    if (availablePlayers.length % 2 !== 0) {
        let byePlayerIndex = -1;
        // Find the lowest ranked player who hasn't had a bye
        for (let i = availablePlayers.length - 1; i >= 0; i--) {
            if (!availablePlayers[i].opponentIds.includes('bye')) {
                byePlayerIndex = i;
                break;
            }
        }
        // If all have had a bye, give it to the lowest ranked player
        if (byePlayerIndex === -1 && availablePlayers.length > 0) {
            byePlayerIndex = availablePlayers.length - 1;
        }
        
        if (byePlayerIndex !== -1) {
          const byePlayer = availablePlayers.splice(byePlayerIndex, 1)[0];
          pairings.push({ player1: byePlayer, player2: { id: 'bye', name: 'BYE' } });
        }
    }
  
    function findPairings(playersToPair: StandingsPlayer[]): Pairing[] | null {
        if (playersToPair.length === 0) {
            return [];
        }
  
        const player1 = playersToPair[0];
        const remainingPlayers = playersToPair.slice(1);
  
        for (let i = 0; i < remainingPlayers.length; i++) {
            const player2 = remainingPlayers[i];
  
            if (!player1.opponentIds.includes(player2.id)) {
                const nextPlayersToPair = remainingPlayers.filter((_, index) => index !== i);
                const result = findPairings(nextPlayersToPair);
  
                if (result !== null) {
                    return [{ player1, player2 }, ...result];
                }
            }
        }
  
        return null; // No valid pairing found
    }
    
    const finalPairings = findPairings(availablePlayers);

    if (finalPairings) {
        return [...pairings, ...finalPairings];
    }
    
    // Fallback logic if the recursive search fails (should be rare)
    console.warn("Could not find a perfect pairing without rematches. Using fallback pairing.");
    const playerQueue = [...availablePlayers];
    while(playerQueue.length > 0) {
        const p1 = playerQueue.shift()!;
        let opponent: Player | null = null;
        let opponentIndex = -1;

        // Find the best-ranked opponent they haven't played
        for (let i = 0; i < playerQueue.length; i++) {
            if (!p1.opponentIds.includes(playerQueue[i].id)) {
                opponent = playerQueue[i];
                opponentIndex = i;
                break;
            }
        }
        // If all available opponents have been played, find the one played longest ago
        if (opponent === null && playerQueue.length > 0) {
            opponent = playerQueue[0];
            opponentIndex = 0;
        }

        if (opponent) {
            pairings.push({ player1: p1, player2: opponent });
            playerQueue.splice(opponentIndex, 1);
        }
    }

    return pairings;
  };

  const startTournament = () => {
    if (state.status !== 'registration' || state.players.length < 2) return;
    
    const nextRoundNumber = 1;
    const firstRoundPairings = generatePairings(state.players, nextRoundNumber);
    
    const newState = produce(state, draft => {
        draft.currentRound = nextRoundNumber;
        draft.status = 'running';
        draft.pairings = firstRoundPairings;
        draft.history[nextRoundNumber] = { pairings: firstRoundPairings, players: draft.players };

        const byePairing = firstRoundPairings.find(p => p.player2.id === 'bye');
        if(byePairing) {
            const playerInDraft = draft.players.find(p => p.id === byePairing.player1.id);
            if(playerInDraft) {
                playerInDraft.points += 3;
                playerInDraft.matches.push({ 
                    round: nextRoundNumber, 
                    opponentId: 'bye', 
                    result: 'win',
                    gamesWon: 2,
                    gamesLost: 0,
                    gamesDrawn: 0,
                });
                playerInDraft.opponentIds.push('bye');
                playerInDraft.gameWins += 2;
                playerInDraft.gamesPlayed += 2;
            }
        }
    });

    setState(newState);
  };

  const startManualTournament = (manualPairings: ManualPairing[]) => {
    if (state.status !== 'registration' || state.players.length < 2) return;

    const nextRoundNumber = 1;

    setState(
      produce((draft: TournamentState) => {
        draft.currentRound = nextRoundNumber;
        draft.status = 'running';
        draft.pairings = manualPairings;
        draft.history[nextRoundNumber] = {
          pairings: manualPairings,
          players: draft.players,
        };

        const byePairing = manualPairings.find(p => p.player2.id === 'bye');
        if (byePairing) {
          const playerInDraft = draft.players.find(
            p => p.id === byePairing.player1.id
          );
          if (playerInDraft) {
            playerInDraft.points += 3;
            playerInDraft.matches.push({
              round: nextRoundNumber,
              opponentId: 'bye',
              result: 'win',
              gamesWon: 2,
              gamesLost: 0,
              gamesDrawn: 0,
            });
            playerInDraft.opponentIds.push('bye');
            playerInDraft.gameWins += 2;
            playerInDraft.gamesPlayed += 2;
          }
        }
      })
    );
  };
  
  const generateNextRound = () => {
    if (state.status !== 'running') return;
    
    const nextRoundNumber = state.currentRound + 1;
    const newPairings = generatePairings(state.players, nextRoundNumber);
    
    const newState = produce(state, draft => {
        draft.history[draft.currentRound] = { pairings: draft.pairings, players: JSON.parse(JSON.stringify(draft.players)) };
        draft.currentRound = nextRoundNumber;
        draft.pairings = newPairings;
        draft.viewingRound = null;
        
        const byePairing = newPairings.find(p => p.player2.id === 'bye');
        if(byePairing) {
            const playerInDraft = draft.players.find(p => p.id === byePairing.player1.id);
            if(playerInDraft) {
                playerInDraft.points += 3;
                playerInDraft.matches.push({ 
                    round: nextRoundNumber, 
                    opponentId: 'bye', 
                    result: 'win',
                    gamesWon: 2,
                    gamesLost: 0,
                    gamesDrawn: 0,
                });
                playerInDraft.opponentIds.push('bye');
                playerInDraft.gameWins += 2;
                playerInDraft.gamesPlayed += 2;
            }
        }
    });

    setState(newState);
  };
  
  const calculateStandings = (players: Player[]): StandingsPlayer[] => {
    if (!players || players.length === 0) return [];
    const playerMap = new Map(players.map(p => [p.id, p]));

    const standingsPlayers: StandingsPlayer[] = players.map(player => {
        const gwPercentage = player.gamesPlayed > 0 ? player.gameWins / player.gamesPlayed : 0;
        
        let totalOpponentMW = 0;
        const opponentsPlayed = player.opponentIds.filter(id => id !== 'bye');
        for (const opponentId of opponentsPlayed) {
            const opponent = playerMap.get(opponentId);
            if (opponent) {
                const opponentMatchWins = opponent.matches.filter(m => m.result === 'win').length;
                const opponentMatchesPlayedThatCount = opponent.matches.filter(m => m.opponentId !== 'bye').length;
                const mwPercentage = opponentMatchesPlayedThatCount > 0 ? opponentMatchWins / opponentMatchesPlayedThatCount : 0;
                totalOpponentMW += Math.max(0.33, mwPercentage);
            }
        }
        const omwPercentage = opponentsPlayed.length > 0 ? totalOpponentMW / opponentsPlayed.length : 0;

        return {
            ...player,
            gwPercentage,
            omwPercentage,
            ogwPercentage: 0,
        };
    });
    
    const standingsPlayerMap = new Map(standingsPlayers.map(p => [p.id, p]));

    standingsPlayers.forEach(player => {
        let totalOpponentGW = 0;
        const opponentsPlayed = player.opponentIds.filter(id => id !== 'bye');
        for (const opponentId of opponentsPlayed) {
            const opponent = standingsPlayerMap.get(opponentId);
            if (opponent) {
                totalOpponentGW += opponent.gwPercentage;
            }
        }
        player.ogwPercentage = opponentsPlayed.length > 0 ? totalOpponentGW / opponentsPlayed.length : 0;
    });

    standingsPlayers.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.omwPercentage !== a.omwPercentage) return b.omwPercentage - a.omwPercentage;
        if (b.gwPercentage !== a.gwPercentage) return b.gwPercentage - a.gwPercentage;
        if (b.ogwPercentage !== a.ogwPercentage) return b.ogwPercentage - a.ogwPercentage;
        return Math.random() - 0.5; // Randomize players with exact same stats
    });

    return standingsPlayers;
  };

  const updateMatchResult = (round: number, p1Id: string, p2Id: string, p1Games: number, p2Games: number) => {
      setState(
        produce((draft: TournamentState) => {
          let playersToUpdate = draft.players;
          // If editing a past round, use historical player data
          if (round < draft.currentRound && draft.history[round]) {
              playersToUpdate = draft.history[round].players;
          }

          const player1 = playersToUpdate.find(p => p.id === p1Id);
          const player2 = playersToUpdate.find(p => p.id === p2Id);

          if (!player1 || !player2) return;
          
          // Clear old result if it exists
          const p1MatchIndex = player1.matches.findIndex(m => m.round === round);
          const p2MatchIndex = player2.matches.findIndex(m => m.round === round);
          if (p1MatchIndex > -1) {
            const oldMatch = player1.matches[p1MatchIndex];
            player1.gameWins -= oldMatch.gamesWon;
            player1.gamesPlayed -= (oldMatch.gamesWon + oldMatch.gamesLost);
            if (oldMatch.result === 'win') player1.points -= 3;
            player1.matches.splice(p1MatchIndex, 1);
          }
          if (p2MatchIndex > -1) {
            const oldMatch = player2.matches[p2MatchIndex];
            player2.gameWins -= oldMatch.gamesWon;
            player2.gamesPlayed -= (oldMatch.gamesWon + oldMatch.gamesLost);
            if (oldMatch.result === 'win') player2.points -= 3;
            player2.matches.splice(p2MatchIndex, 1);
          }
          
          let p1Points, p2Points;
          let p1Result, p2Result;

          // A match is only a "win" if a player wins 2 games. Otherwise it's a double loss.
          if (p1Games === 2) {
            p1Points = 3; p2Points = 0;
            p1Result = 'win'; p2Result = 'loss';
          } else if (p2Games === 2) {
            p1Points = 0; p2Points = 3;
            p1Result = 'loss'; p2Result = 'win';
          } else { // 1-1, 1-0, 0-0 etc. are all double losses
            p1Points = 0; p2Points = 0;
            p1Result = 'loss'; p2Result = 'loss';
          }

          const gamesPlayed = p1Games + p2Games;

          player1.points += p1Points;
          player1.matches.push({ round, opponentId: p2Id, result: p1Result, gamesWon: p1Games, gamesLost: p2Games, gamesDrawn: 0 });
          if (!player1.opponentIds.includes(p2Id)) player1.opponentIds.push(p2Id);
          player1.gameWins += p1Games;
          player1.gamesPlayed += gamesPlayed;
          
          player2.points += p2Points;
          player2.matches.push({ round, opponentId: p1Id, result: p2Result, gamesWon: p2Games, gamesLost: p1Games, gamesDrawn: 0 });
          if (!player2.opponentIds.includes(p1Id)) player2.opponentIds.push(p1Id);
          player2.gameWins += p2Games;
          player2.gamesPlayed += gamesPlayed;
          
          // If we edited a past round, we need to recalculate subsequent history
          if (round < draft.currentRound) {
            draft.players = JSON.parse(JSON.stringify(playersToUpdate));
            for (let i = round + 1; i <= draft.currentRound; i++) {
                delete draft.history[i];
            }
            draft.currentRound = round;
            draft.pairings = draft.history[round].pairings;
            draft.viewingRound = null;
          }
        })
      );
  };
  
  const goToRound = (round: number | null) => {
    setState(produce(draft => {
        draft.viewingRound = round;
    }));
  };

  const resetTournament = () => {
    try {
        localStorage.removeItem(TOURNAMENT_STORAGE_KEY);
    } catch(error) {
        console.error("Failed to remove tournament state from localStorage", error);
    }
    setState(initialTournamentState);
  };

  const exportTournament = (): string => {
    return JSON.stringify(state, null, 2);
  };

  const importTournament = (fileContent: string) => {
    setPendingImport(fileContent);
  };

  const confirmImport = () => {
    if (pendingImport) {
      try {
        const newState = JSON.parse(pendingImport);
        // Add basic validation
        if (newState.players && newState.status && newState.history) {
          setState(newState);
        } else {
          throw new Error("Invalid tournament file structure.");
        }
      } catch (e) {
        console.error("Failed to parse imported file:", e);
        // Optionally, show an error toast to the user
      } finally {
        setPendingImport(null);
      }
    }
  };

  const cancelImport = () => {
    setPendingImport(null);
  };


  const allResultsSubmitted = useMemo(() => {
    if (state.status !== 'running') return false;
    const activePairings = state.pairings.filter(p => p.player2.id !== 'bye');
    const submittedResults = activePairings.filter(p => {
        const player1 = state.players.find(pl => pl.id === p.player1.id);
        return player1?.matches.some(m => m.round === state.currentRound);
    });
    return activePairings.length === submittedResults.length;
  }, [state.players, state.pairings, state.currentRound, state.status]);

  return {
    state: {
      ...state,
      players: calculateStandings(state.players),
      allResultsSubmitted,
    },
    pendingImport,
    addPlayer,
    removePlayer,
    startTournament,
    startManualTournament,
    generateNextRound,
    updateMatchResult,
    resetTournament,
    goToRound,
    exportTournament,
    importTournament,
    confirmImport,
    cancelImport,
  };
}
