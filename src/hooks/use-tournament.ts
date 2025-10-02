
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TournamentState, Player, Match, Pairing, MatchResult, StandingsPlayer } from '@/lib/types';
import { produce } from 'immer';

const initialTournamentState: TournamentState = {
  players: [],
  currentRound: 0,
  pairings: [],
  status: 'registration',
};

const TOURNAMENT_STORAGE_KEY = 'ygo-tournament-state';

export function useTournament() {
  const [state, setState] = useState<TournamentState>(initialTournamentState);

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
  
  const generatePairings = (players: Player[], round: number): Pairing[] => {
      const sortedPlayers = calculateStandings(players);
      const pairings: Pairing[] = [];
      const pairedIds = new Set<string>();

      // Handle bye for odd number of players
      if (sortedPlayers.length % 2 !== 0) {
          // Find the lowest-ranked player who hasn't had a bye yet
          let byePlayer: Player | undefined;
          for (let i = sortedPlayers.length - 1; i >= 0; i--) {
              const player = sortedPlayers[i];
              if (!player.opponentIds.includes('bye')) {
                  byePlayer = player;
                  break;
              }
          }
          // If all have had a bye, give it to the lowest player
          if (!byePlayer) {
              byePlayer = sortedPlayers[sortedPlayers.length - 1];
          }
          
          if (byePlayer) {
            pairings.push({ player1: byePlayer, player2: { id: 'bye', name: 'BYE' } });
            pairedIds.add(byePlayer.id);
          }
      }


      for (const player of sortedPlayers) {
          if (pairedIds.has(player.id)) continue;
          
          // Find a valid opponent (swiss pairings)
          let opponent: Player | null = null;
          for (const potentialOpponent of sortedPlayers) {
              if (
                  !pairedIds.has(potentialOpponent.id) &&
                  player.id !== potentialOpponent.id &&
                  !player.opponentIds.includes(potentialOpponent.id)
              ) {
                  opponent = potentialOpponent;
                  break;
              }
          }
          
          if (opponent) {
              pairings.push({ player1: player, player2: opponent });
              pairedIds.add(player.id);
              pairedIds.add(opponent.id);
          } else {
             // If no opponent found that they haven't played, start pairing down
             // Find any unpaired player
             for (const potentialOpponent of sortedPlayers) {
                 if (!pairedIds.has(potentialOpponent.id) && player.id !== potentialOpponent.id) {
                     opponent = potentialOpponent;
                     break;
                 }
             }
             if (opponent) {
                pairings.push({ player1: player, player2: opponent });
                pairedIds.add(player.id);
                pairedIds.add(opponent.id);
             }
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
        
        // Handle bye
        const byePairing = firstRoundPairings.find(p => p.player2.id === 'bye');
        if(byePairing) {
            const playerInDraft = draft.players.find(p => p.id === byePairing.player1.id);
            if(playerInDraft) {
                playerInDraft.points += 3; // 3 points for a bye win
                playerInDraft.matches.push({ 
                    round: nextRoundNumber, 
                    opponentId: 'bye', 
                    result: 'win',
                    gamesWon: 1, // Conventionally a 1-0 or 2-0 win
                    gamesLost: 0,
                    gamesDrawn: 0,
                });
                playerInDraft.opponentIds.push('bye');
                playerInDraft.gameWins += 1;
                playerInDraft.gamesPlayed += 1;
            }
        }
    });

    setState(newState);
  };
  
  const generateNextRound = () => {
    if (state.status !== 'running') return;
    
    const nextRoundNumber = state.currentRound + 1;
    const newPairings = generatePairings(state.players, nextRoundNumber);
    
    const newState = produce(state, draft => {
        draft.currentRound = nextRoundNumber;
        draft.pairings = newPairings;
        
        // Handle bye
        const byePairing = newPairings.find(p => p.player2.id === 'bye');
        if(byePairing) {
            const playerInDraft = draft.players.find(p => p.id === byePairing.player1.id);
            if(playerInDraft) {
                playerInDraft.points += 3;
                playerInDraft.matches.push({ 
                    round: nextRoundNumber, 
                    opponentId: 'bye', 
                    result: 'win',
                    gamesWon: 1,
                    gamesLost: 0,
                    gamesDrawn: 0,
                });
                playerInDraft.opponentIds.push('bye');
                playerInDraft.gameWins += 1;
                playerInDraft.gamesPlayed += 1;
            }
        }
    });

    setState(newState);
  };
  
  const calculateStandings = (players: Player[]): StandingsPlayer[] => {
    const playerMap = new Map(players.map(p => [p.id, p]));

    const standingsPlayers: StandingsPlayer[] = players.map(player => {
        // Calculate GW% (Game Win Percentage)
        const gwPercentage = player.gamesPlayed > 0 ? player.gameWins / player.gamesPlayed : 0;

        // Calculate OMW% (Opponent's Match Win Percentage)
        let totalOpponentMW = 0;
        const opponentsPlayed = player.opponentIds.filter(id => id !== 'bye');
        for (const opponentId of opponentsPlayed) {
            const opponent = playerMap.get(opponentId);
            if (opponent) {
                const opponentMatchWins = opponent.matches.filter(m => m.result === 'win').length;
                const opponentMatchesPlayed = opponent.matches.length;
                const mwPercentage = opponentMatchesPlayed > 0 ? opponentMatchWins / opponentMatchesPlayed : 0;
                totalOpponentMW += Math.max(0.33, mwPercentage);
            }
        }
        const omwPercentage = opponentsPlayed.length > 0 ? totalOpponentMW / opponentsPlayed.length : 0;

        return {
            ...player,
            gwPercentage,
            omwPercentage,
            ogwPercentage: 0, // Placeholder, calculated next
        };
    });
    
    const standingsPlayerMap = new Map(standingsPlayers.map(p => [p.id, p]));

    // Calculate OGW% (Opponent's Game Win Percentage)
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


    // Sort by points, then by OMW%, then GW%, then OGW%
    standingsPlayers.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.omwPercentage !== a.omwPercentage) return b.omwPercentage - a.omwPercentage;
        if (b.gwPercentage !== a.gwPercentage) return b.gwPercentage - a.gwPercentage;
        return b.ogwPercentage - a.ogwPercentage;
    });

    return standingsPlayers;
  };


  const updateMatchResult = (pairing: Pairing, p1Games: number, p2Games: number) => {
      const p1Id = pairing.player1.id;
      const p2Id = pairing.player2.id;
      if (p2Id === 'bye') return;
      
      setState(
        produce((draft: TournamentState) => {
          const player1 = draft.players.find(p => p.id === p1Id);
          const player2 = draft.players.find(p => p.id === p2Id);

          if (!player1 || !player2) return;
          
          // Check if result for this round already exists
          if (player1.matches.some(m => m.round === draft.currentRound) || player2.matches.some(m => m.round === draft.currentRound)) {
              return; 
          }

          let p1Result: MatchResult;
          let p2Result: MatchResult;
          let p1Points: number;
          let p2Points: number;

          if (p1Games > p2Games) {
              p1Result = 'win';
              p2Result = 'loss';
              p1Points = 3;
              p2Points = 0;
          } else if (p2Games > p1Games) {
              p1Result = 'loss';
              p2Result = 'win';
              p1Points = 0;
              p2Points = 3;
          } else {
              p1Result = 'draw';
              p2Result = 'draw';
              p1Points = 0; // Draw is 0 points
              p2Points = 0; // Draw is 0 points
          }

          const gamesPlayed = p1Games + p2Games;

          // Update Player 1
          player1.points += p1Points;
          player1.matches.push({ round: draft.currentRound, opponentId: p2Id, result: p1Result, gamesWon: p1Games, gamesLost: p2Games, gamesDrawn: 0 });
          player1.opponentIds.push(p2Id);
          player1.gameWins += p1Games;
          player1.gamesPlayed += gamesPlayed;
          
          // Update Player 2
          player2.points += p2Points;
          player2.matches.push({ round: draft.currentRound, opponentId: p1Id, result: p2Result, gamesWon: p2Games, gamesLost: p1Games, gamesDrawn: 0 });
          player2.opponentIds.push(p1Id);
          player2.gameWins += p2Games;
          player2.gamesPlayed += gamesPlayed;
        })
      );
  };

  const resetTournament = () => {
    setState(initialTournamentState);
    try {
        localStorage.removeItem(TOURNAMENT_STORAGE_KEY);
    } catch(error) {
        console.error("Failed to remove tournament state from localStorage", error);
    }
  };

  return {
    state: {
      ...state,
      players: calculateStandings(state.players), // Always return sorted players
    },
    addPlayer,
    startTournament,
    generateNextRound,
    updateMatchResult,
    resetTournament,
  };
}
