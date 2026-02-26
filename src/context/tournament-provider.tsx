
'use client';

import { useState, useEffect, useMemo, createContext, useContext, ReactNode } from 'react';
import type { TournamentState, Player, Pairing, StandingsPlayer, ManualPairing } from '@/lib/types';
import { produce } from 'immer';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const TOURNAMENT_DOC_ID = 'current';

const initialTournamentState: TournamentState = {
  players: [],
  currentRound: 0,
  pairings: [],
  status: 'registration',
  history: {},
};

// Helper to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export const calculateStandings = (players: Player[]): StandingsPlayer[] => {
    if (!players || players.length === 0) return [];
    const playerMap = new Map(players.map(p => [p.id, p]));

    const standingsPlayers: StandingsPlayer[] = players.map(player => {
        const gamesPlayed = player.matches.filter(m => m.opponentId !== 'bye').reduce((acc, m) => acc + m.gamesWon + m.gamesLost, 0);
        const gameWins = player.matches.filter(m => m.opponentId !== 'bye').reduce((acc, m) => acc + m.gamesWon, 0);
        const gwPercentage = gamesPlayed > 0 ? gameWins / gamesPlayed : 0;
        
        let opponentTotalPoints = 0;
        const opponentsPlayed = player.opponentIds.filter(id => id !== 'bye');
        for (const opponentId of opponentsPlayed) {
            const opponent = playerMap.get(opponentId);
            if (opponent) {
                opponentTotalPoints += opponent.points;
            }
        }
        
        return {
            ...player,
            gamesPlayed,
            gameWins,
            gwPercentage,
            opponentTotalPoints,
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
        if (b.opponentTotalPoints !== a.opponentTotalPoints) return b.opponentTotalPoints - a.opponentTotalPoints;
        if (b.gwPercentage !== a.gwPercentage) return b.gwPercentage - a.gwPercentage;
        if (b.ogwPercentage !== a.ogwPercentage) return b.ogwPercentage - a.ogwPercentage;
        return Math.random() - 0.5; // Randomize players with exact same stats
    });

    return standingsPlayers;
};

type ResultInput = { p1Id: string; p2Id: string; p1Games: number; p2Games: number };

interface TournamentContextType {
    state: TournamentState & { players: StandingsPlayer[]; allResultsSubmitted: boolean; viewingRound: number | null };
    pendingImport: string | null;
    addPlayer: (name: string) => void;
    removePlayer: (id: string) => void;
    startTournament: () => void;
    startManualTournament: (pairings: ManualPairing[]) => void;
    generateNextRound: () => void;
    submitMultipleResults: (round: number, results: ResultInput[]) => void;
    updatePairings: (newPairings: ManualPairing[]) => void;
    resetTournament: () => void;
    goToRound: (round: number | null) => void;
    exportTournament: () => string;
    importTournament: (fileContent: string) => void;
    confirmImport: () => void;
    cancelImport: () => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [tournamentState, setTournamentState] = useState<TournamentState>(initialTournamentState);
  const [viewingRound, setViewingRound] = useState<number | null>(null);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    const tournamentRef = doc(firestore, 'tournaments', TOURNAMENT_DOC_ID);
    
    const unsubscribe = onSnapshot(tournamentRef, (docSnap) => {
      if (docSnap.exists()) {
        setTournamentState(docSnap.data() as TournamentState);
      } else {
        setDoc(tournamentRef, initialTournamentState).catch(e => {
            console.error("Failed to initialize tournament document:", e)
        });
      }
    }, (error) => {
        console.error("Error listening to tournament document:", error);
    });

    return () => unsubscribe();
  }, [firestore]);

  const updateFirestoreState = async (newState: TournamentState) => {
      if (!firestore) return;
      const tournamentRef = doc(firestore, 'tournaments', TOURNAMENT_DOC_ID);
      await setDoc(tournamentRef, newState, { merge: true });
  }

  const addPlayer = (name: string) => {
    if (tournamentState.status !== 'registration') return;
    const newPlayer: Player = {
      id: `player-${Date.now()}-${Math.random()}`,
      name,
      points: 0,
      matches: [],
      opponentIds: [],
      gameWins: 0,
      gamesPlayed: 0,
    };
    const newState = produce(tournamentState, draft => {
        draft.players.push(newPlayer);
    });
    updateFirestoreState(newState);
  };
  
  const removePlayer = (id: string) => {
    if (tournamentState.status !== 'registration') return;
    const newState = produce(tournamentState, draft => {
      draft.players = draft.players.filter(p => p.id !== id);
    });
    updateFirestoreState(newState);
  };

  const generatePairings = (players: Player[], round: number): Pairing[] => {
    const sortedPlayers = calculateStandings(players);
    const pairings: Pairing[] = [];
    const pairedPlayerIds = new Set<string>();
  
    let availablePlayers = [...sortedPlayers];
  
    if (availablePlayers.length % 2 !== 0) {
        let byePlayerAssigned = false;
        for (let i = availablePlayers.length - 1; i > 0; i--) {
            if (!availablePlayers[i].opponentIds.includes('bye')) {
                const byePlayer = availablePlayers.splice(i, 1)[0];
                pairings.push({ player1: byePlayer, player2: { id: 'bye', name: 'BYE' } });
                pairedPlayerIds.add(byePlayer.id);
                byePlayerAssigned = true;
                break;
            }
        }
        
        if (!byePlayerAssigned && availablePlayers.length > 1) {
            const byePlayer = availablePlayers.pop()!;
            pairings.push({ player1: byePlayer, player2: { id: 'bye', name: 'BYE' } });
            pairedPlayerIds.add(byePlayer.id);
        }
    }
    
    let playersToPair = [...availablePlayers];
    let couldn_t_pair: Player[] = [];
    
    while (playersToPair.length > 1) {
      const p1 = playersToPair.shift()!;
      let paired = false;
      for (let i = 0; i < playersToPair.length; i++) {
        const p2 = playersToPair[i];
        if (!p1.opponentIds.includes(p2.id)) {
          pairings.push({ player1: p1, player2: p2 });
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
      pairings.push({ player1: p1, player2: p2 });
    }
  
    return pairings;
  };

  const startTournament = () => {
    if (tournamentState.status !== 'registration' || tournamentState.players.length < 2) return;
    
    const nextRoundNumber = 1;
    
    const newState = produce(tournamentState, draft => {
        draft.history = {};
        const firstRoundPairings = generatePairings(draft.players, nextRoundNumber);

        draft.currentRound = nextRoundNumber;
        draft.status = 'running';
        draft.pairings = firstRoundPairings;
        
        draft.history[nextRoundNumber] = { 
            pairings: firstRoundPairings, 
            players: JSON.parse(JSON.stringify(draft.players)) 
        };

        const byePairing = firstRoundPairings.find(p => p.player2.id === 'bye');
        if(byePairing) {
            const playerInDraft = draft.players.find(p => p.id === byePairing.player1.id);
            if(playerInDraft) {
                playerInDraft.points += 3;
                playerInDraft.matches.push({ 
                    round: nextRoundNumber, 
                    opponentId: 'bye', 
                    result: 'win',
                    gamesWon: 0,
                    gamesLost: 0,
                });
                playerInDraft.opponentIds.push('bye');
            }
        }
    });
    updateFirestoreState(newState);
  };

  const startManualTournament = (manualPairings: ManualPairing[]) => {
    if (tournamentState.status !== 'registration' || tournamentState.players.length < 2) return;

    const nextRoundNumber = 1;

    const newState = produce(tournamentState, (draft: TournamentState) => {
        draft.history = {};
        draft.currentRound = nextRoundNumber;
        draft.status = 'running';
        draft.pairings = manualPairings;
        
        draft.history[nextRoundNumber] = {
          pairings: manualPairings,
          players: JSON.parse(JSON.stringify(draft.players)),
        };

        const byePairing = manualPairings.find(p => p.player2.id === 'bye');
        if (byePairing) {
          const playerInDraft = draft.players.find(p => p.id === byePairing.player1.id);
          if (playerInDraft) {
            playerInDraft.points += 3;
            playerInDraft.matches.push({
              round: nextRoundNumber,
              opponentId: 'bye',
              result: 'win',
              gamesWon: 0,
              gamesLost: 0,
            });
            playerInDraft.opponentIds.push('bye');
          }
        }
    });
    updateFirestoreState(newState);
  };
  
  const generateNextRound = () => {
    if (tournamentState.status !== 'running') return;
    
    const nextRoundNumber = tournamentState.currentRound + 1;
    
    const newState = produce(tournamentState, draft => {
        draft.history[nextRoundNumber] = { pairings: [], players: JSON.parse(JSON.stringify(draft.players)) };

        const newPairings = generatePairings(draft.players, nextRoundNumber);
        
        draft.currentRound = nextRoundNumber;
        draft.pairings = newPairings;
        
        draft.history[nextRoundNumber].pairings = newPairings;
        
        const byePairing = newPairings.find(p => p.player2.id === 'bye');
        if(byePairing) {
            const playerInDraft = draft.players.find(p => p.id === byePairing.player1.id);
            if(playerInDraft) {
                playerInDraft.points += 3;
                playerInDraft.matches.push({ 
                    round: nextRoundNumber, 
                    opponentId: 'bye', 
                    result: 'win',
                    gamesWon: 0,
                    gamesLost: 0,
                });
                playerInDraft.opponentIds.push('bye');
            }
        }
    });
    setViewingRound(null);
    updateFirestoreState(newState);
  };
  
  const submitMultipleResults = (round: number, results: ResultInput[]) => {
      const newState = produce(tournamentState, (draft: TournamentState) => {
          if (round < draft.currentRound) {
            if (!draft.history[round]) return;
            draft.players = JSON.parse(JSON.stringify(draft.history[round].players));
            for (let i = round + 1; i <= draft.currentRound; i++) {
              delete draft.history[i];
            }
            draft.currentRound = round;
            draft.pairings = draft.history[round].pairings as Pairing[];
          }
    
          results.forEach(({p1Id, p2Id, p1Games, p2Games}) => {
            const player1 = draft.players.find(p => p.id === p1Id);
            const player2 = draft.players.find(p => p.id === p2Id);
            if (!player1 || !player2) return;
      
            const isAlreadyProcessed = player1.matches.some(m => m.round === round && m.opponentId === p2Id);
            if (isAlreadyProcessed) return;
      
            let p1Points, p2Points;
            let p1Result, p2Result;
      
            if (p1Games > p2Games) {
              p1Points = 3; p2Points = 0;
              p1Result = 'win'; p2Result = 'loss';
            } else if (p2Games > p1Games) {
              p1Points = 0; p2Points = 3;
              p1Result = 'loss'; p2Result = 'win';
            } else {
              p1Points = 1; p2Points = 1;
              p1Result = 'draw'; p2Result = 'draw';
            }
  
            player1.points += p1Points;
            player1.matches.push({ round, opponentId: p2Id, result: p1Result, gamesWon: p1Games, gamesLost: p2Games });
            if (!player1.opponentIds.includes(p2Id)) player1.opponentIds.push(p2Id);
            
            player2.points += p2Points;
            player2.matches.push({ round, opponentId: p1Id, result: p2Result, gamesWon: p2Games, gamesLost: p1Games });
            if (!player2.opponentIds.includes(p1Id)) player2.opponentIds.push(p1Id);
          });
      });
      setViewingRound(null);
      updateFirestoreState(newState);
  };
  
    const updatePairings = (newPairings: ManualPairing[]) => {
        if (tournamentState.status !== 'running') return;

        const oldByePlayerId = tournamentState.pairings.find(p => p.player2.id === 'bye')?.player1.id;
        
        const newState = produce(tournamentState, draft => {
            draft.pairings = newPairings;
            if (draft.history[draft.currentRound]) {
                draft.history[draft.currentRound].pairings = newPairings;
            }

            const newByePlayerId = newPairings.find(p => p.player2.id === 'bye')?.player1.id;

            if (oldByePlayerId && oldByePlayerId !== newByePlayerId) {
                const oldByePlayer = draft.players.find(p => p.id === oldByePlayerId);
                if (oldByePlayer) {
                    const byeMatchIndex = oldByePlayer.matches.findIndex(m => m.round === draft.currentRound && m.opponentId === 'bye');
                    if (byeMatchIndex > -1) {
                        oldByePlayer.points -= 3;
                        oldByePlayer.matches.splice(byeMatchIndex, 1);
                        
                        const opponentIdIndex = oldByePlayer.opponentIds.lastIndexOf('bye');
                        if (opponentIdIndex > -1) {
                            oldByePlayer.opponentIds.splice(opponentIdIndex, 1);
                        }
                    }
                }
            }

            if (newByePlayerId) {
                const newByePlayer = draft.players.find(p => p.id === newByePlayerId);
                if (newByePlayer && !newByePlayer.matches.some(m => m.round === draft.currentRound && m.opponentId === 'bye')) {
                    newByePlayer.points += 3;
                    newByePlayer.matches.push({ round: draft.currentRound, opponentId: 'bye', result: 'win', gamesWon: 0, gamesLost: 0 });
                    if (!newByePlayer.opponentIds.includes('bye')) newByePlayer.opponentIds.push('bye');
                }
            }
        });
        updateFirestoreState(newState);
    };

  const goToRound = (round: number | null) => {
    setViewingRound(round);
  };

  const resetTournament = () => {
    updateFirestoreState(initialTournamentState);
    setViewingRound(null);
  };

  const exportTournament = (): string => {
    return JSON.stringify(tournamentState, null, 2);
  };

  const importTournament = (fileContent: string) => {
    setPendingImport(fileContent);
  };

  const confirmImport = () => {
    if (pendingImport) {
      try {
        const newState = JSON.parse(pendingImport);
        if (newState.players && newState.status && newState.history) {
          updateFirestoreState(newState);
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

  const processedState = useMemo(() => {
    const allResultsSubmitted = (() => {
        if (tournamentState.status !== 'running') return false;
        const activePairings = tournamentState.pairings.filter(p => p.player2.id !== 'bye');
        if (activePairings.length === 0) return true; 
        
        const submittedResults = activePairings.filter(p => {
            const player1 = tournamentState.players.find(pl => pl.id === p.player1.id);
            return player1?.matches.some(m => m.round === tournamentState.currentRound && m.opponentId !== 'bye');
        });
        return activePairings.length === submittedResults.length;
    })();

    return {
        ...tournamentState,
        viewingRound,
        players: calculateStandings(tournamentState.players),
        allResultsSubmitted,
    };
  }, [tournamentState, viewingRound]);


  const value: TournamentContextType = {
    state: processedState,
    pendingImport,
    addPlayer,
    removePlayer,
    startTournament,
    startManualTournament,
    generateNextRound,
    submitMultipleResults,
    updatePairings,
    resetTournament,
    goToRound,
    exportTournament,
    importTournament,
    confirmImport,
    cancelImport,
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
