
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
    };
    const newState = produce(state, draft => {
        draft.players.push(newPlayer);
    });
    setState(newState);
  };
  
  const generatePairings = (players: Player[], round: number): Pairing[] => {
      const sortedPlayers = [...players].sort((a, b) => b.points - a.points);
      const pairings: Pairing[] = [];
      const pairedIds = new Set<string>();

      for (const player of sortedPlayers) {
          if (pairedIds.has(player.id)) continue;
          
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
             // If no opponent found, try to find one they already played
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
             } else if (!pairedIds.has(player.id)) {
                // This player gets a bye
                pairings.push({ player1: player, player2: { id: 'bye', name: 'BYE' } });
                pairedIds.add(player.id);
             }
          }
      }

      if (sortedPlayers.length % 2 !== 0) {
          const unpairedPlayer = sortedPlayers.find(p => !pairedIds.has(p.id));
          if (unpairedPlayer) {
              pairings.push({ player1: unpairedPlayer, player2: { id: 'bye', name: 'BYE' } });
          }
      }


      return pairings;
  };

  const startTournament = () => {
    if (state.status !== 'registration' || state.players.length < 2) return;
    
    // Randomize initial pairings
    const shuffledPlayers = [...state.players].sort(() => Math.random() - 0.5);
    const firstRoundPairings: Pairing[] = [];
    
    for (let i = 0; i < shuffledPlayers.length; i += 2) {
        if (i + 1 < shuffledPlayers.length) {
            firstRoundPairings.push({ player1: shuffledPlayers[i], player2: shuffledPlayers[i+1] });
        } else {
            // Bye for the last player if odd number
            firstRoundPairings.push({ player1: shuffledPlayers[i], player2: { id: 'bye', name: 'BYE' } });
        }
    }
    
    const newState = produce(state, draft => {
        draft.currentRound = 1;
        draft.status = 'running';
        draft.pairings = firstRoundPairings;
        // Handle bye
        const byePlayer = firstRoundPairings.find(p => p.player2.id === 'bye')?.player1;
        if(byePlayer) {
            const playerInDraft = draft.players.find(p => p.id === byePlayer.id);
            if(playerInDraft) {
                playerInDraft.points += 3;
                playerInDraft.matches.push({ round: 1, opponentId: 'bye', result: 'win' });
                playerInDraft.opponentIds.push('bye');
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
        const byePlayer = newPairings.find(p => p.player2.id === 'bye')?.player1;
        if(byePlayer) {
            const playerInDraft = draft.players.find(p => p.id === byePlayer.id);
            if(playerInDraft) {
                playerInDraft.points += 3;
                playerInDraft.matches.push({ round: nextRoundNumber, opponentId: 'bye', result: 'win' });
                playerInDraft.opponentIds.push('bye');
            }
        }
    });

    setState(newState);
  };
  
  const calculateStandings = (players: Player[]): StandingsPlayer[] => {
      const playerMap = new Map(players.map(p => [p.id, p]));

      const standingsPlayers: StandingsPlayer[] = players.map(player => {
        // OMW%
        let totalOpponentMW = 0;
        let opponentsPlayed = 0;
        for (const opponentId of player.opponentIds) {
            if (opponentId === 'bye') continue;
            const opponent = playerMap.get(opponentId);
            if (opponent) {
                opponentsPlayed++;
                const opponentMatchWins = opponent.matches.filter(m => m.result === 'win').length;
                const opponentMatchesPlayed = opponent.matches.length;
                const mwPercentage = opponentMatchesPlayed > 0 ? opponentMatchWins / opponentMatchesPlayed : 0;
                totalOpponentMW += Math.max(0.33, mwPercentage);
            }
        }
        const omwPercentage = opponentsPlayed > 0 ? totalOpponentMW / opponentsPlayed : 0;

        return {
            ...player,
            omwPercentage,
            gwPercentage: 0, // Placeholder
            ogwPercentage: 0, // Placeholder
        };
      });

      // Sort by points, then by OMW%
      standingsPlayers.sort((a, b) => {
          if (b.points !== a.points) {
              return b.points - a.points;
          }
          return b.omwPercentage - a.omwPercentage;
      });

      return standingsPlayers;
  };


  const updateMatchResult = (playerId: string, result: MatchResult) => {
      if (!result) return;
      
      const newState = produce(state, draft => {
          const player = draft.players.find(p => p.id === playerId);
          if (!player) return;

          const pairing = draft.pairings.find(p => p.player1.id === playerId || (p.player2 && p.player2.id === playerId));
          if (!pairing) return;

          // Check if result for this round already exists
          const existingMatch = player.matches.find(m => m.round === draft.currentRound);
          if(existingMatch) return; // Already reported

          const opponent = pairing.player1.id === playerId ? pairing.player2 : pairing.player1;

          const points = { win: 3, loss: 0, draw: 1 }[result];
          player.points += points;
          player.matches.push({ round: draft.currentRound, opponentId: opponent.id, result });
          player.opponentIds.push(opponent.id);
      });
      setState(newState);
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
