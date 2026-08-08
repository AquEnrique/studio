
'use client';

import { useState, useEffect, useMemo, createContext, useContext, ReactNode, useRef, useCallback } from 'react';
import type { Tournament, Player, StandingsPlayer, ManualPairing, Match, Round, DisplayPairing, RoundResult } from '@/lib/types';
import { produce } from 'immer';
import { getPeruTimestamp } from '@/lib/peru-time';
import { Loader2 } from 'lucide-react';

const NPOINT_URL = 'https://api.npoint.io/36dc4af53c22ef8f8eb5';

const initialTournamentState: Tournament = {
  players: [],
  rounds: [],
  status: 'registration',
};

// Recommended number of Swiss rounds for a given player count: ceil(log2(n)), min 1.
export const getRecommendedRounds = (playerCount: number): number => {
  if (playerCount < 2) return 0;
  return Math.max(1, Math.ceil(Math.log2(playerCount)));
};

// Helper to calculate standings from the tournament state
export const calculateStandings = (tournament: Tournament | null): StandingsPlayer[] => {
    if (!tournament || !tournament.players.length) return [];
    
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

    tournament.rounds.forEach((round) => {
      if (!round || !round.matches) return;
      round.matches.forEach(match => {
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

        playerStats[p1Id].opponentIds.push(p2Id);
        playerStats[p2Id].opponentIds.push(p1Id);
        
        const p1Games = match.wonGamesPlayer1;
        const p2Games = match.wonGamesPlayer2;
        playerStats[p1Id].gamesWon += p1Games;
        playerStats[p2Id].gamesWon += p2Games;
        const totalGames = p1Games + p2Games;
        if(totalGames > 0){
          playerStats[p1Id].gamesPlayed += totalGames;
          playerStats[p2Id].gamesPlayed += totalGames;
        }

        if (p1Games === 2) { 
          playerStats[p1Id].points += 3;
        } else if (p2Games === 2) { 
          playerStats[p2Id].points += 3;
        }
      });
    });

    const playerGwpMap = new Map<string, number>();
    tournament.players.forEach(p => {
        const stats = playerStats[p.id];
        const gwp = stats.gamesPlayed > 0 ? stats.gamesWon / stats.gamesPlayed : 0;
        playerGwpMap.set(p.id, gwp);
    });

    const standingsPlayers: StandingsPlayer[] = tournament.players.map(p => {
        const stats = playerStats[p.id];
        
        const opponentTotalPoints = stats.opponentIds.reduce((total, oppId) => {
            return total + (playerStats[oppId]?.points || 0);
        }, 0);

        const opponentGameWinPercentagesSum = stats.opponentIds.reduce((total, oppId) => {
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
            
            if (match.playerId2 === null && match.playerId1 === p.id) { 
                return { opponentName: 'BYE', wins: match.wonGamesPlayer1, losses: match.wonGamesPlayer2, isBye: true };
            }
            
            if (match.playerId2 === null) return null; 

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

    standingsPlayers.sort((a, b) => {
        if (b.playerPoints !== a.playerPoints) return b.playerPoints - a.playerPoints;
        if (b.opponentTotalPoints !== a.opponentTotalPoints) return b.opponentTotalPoints - a.opponentTotalPoints;
        if (b.gameWinPercentage !== a.gameWinPercentage) return b.gameWinPercentage - a.gameWinPercentage;
        if (b.opponentGameWinPercentage !== a.opponentGameWinPercentage) return b.opponentGameWinPercentage - a.opponentGameWinPercentage;
        return 0;
    });

    return standingsPlayers;
};

type ResultInput = { p1Id: string; p2Id: string | null; p1Games: number; p2Games: number };

interface TournamentContextType {
    tournament: Tournament | null;
    standings: StandingsPlayer[];
    currentPairings: DisplayPairing[];
    recommendedRounds: number;
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

const isValidTournamentPayload = (data: any): data is Tournament =>
  !!data && typeof data === 'object' && Object.keys(data).length > 0 && data.players && data.status && data.rounds;

// Newer-than comparison for fechaGuardado strings. A missing/unparseable value never
// counts as "newer" - it just means we don't have proof of a fresher save to defer to.
const isFechaGuardadoNewer = (candidate: string | null | undefined, knownBaseline: string | null): boolean => {
  if (!candidate) return false;
  const candidateTime = new Date(candidate).getTime();
  if (Number.isNaN(candidateTime)) return false;
  if (!knownBaseline) return true;
  const knownTime = new Date(knownBaseline).getTime();
  if (Number.isNaN(knownTime)) return true;
  return candidateTime > knownTime;
};

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [viewingRound, setViewingRound] = useState<number | null>(null);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const [isUpdatingToLatest, setIsUpdatingToLatest] = useState(false);
  const isInitialMount = useRef(true);
  const tournamentRef = useRef(tournament);
  // fechaGuardado of the last version we know for certain we're in sync with (either just
  // fetched or just saved). Used to detect whether the remote copy has moved ahead of us.
  const lastSyncedFechaGuardadoRef = useRef<string | null>(null);
  // Set right before we update local state as a side-effect of a save (to reflect the new
  // fechaGuardado, or to adopt a newer remote version) so the autosave effect below doesn't
  // treat that update as a fresh edit and re-save it.
  const skipNextAutosaveRef = useRef(false);

  useEffect(() => {
    tournamentRef.current = tournament;
  }, [tournament]);

  const fetchTournament = useCallback(async () => {
    try {
      const response = await fetch(NPOINT_URL, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (isValidTournamentPayload(data)) {
          lastSyncedFechaGuardadoRef.current = data.fechaGuardado ?? null;
          skipNextAutosaveRef.current = true;
          setTournament(data);
        } else {
          lastSyncedFechaGuardadoRef.current = null;
          skipNextAutosaveRef.current = true;
          setTournament(initialTournamentState);
        }
      } else {
        lastSyncedFechaGuardadoRef.current = null;
        skipNextAutosaveRef.current = true;
        setTournament(initialTournamentState);
      }
    } catch (error) {
      lastSyncedFechaGuardadoRef.current = null;
      skipNextAutosaveRef.current = true;
      setTournament(initialTournamentState);
    }
  }, []);

  // Central write path: every save (autosave, "Guardar Estado", next round, etc.) goes
  // through here so the newer-version check always runs. Before writing, it re-fetches the
  // remote copy and compares its fechaGuardado against the last version we know we're based
  // on. If the remote has moved ahead (someone else saved from another device/tab while we
  // were editing), we don't overwrite it - we adopt it locally instead and surface the
  // "Actualizando" modal. Otherwise we stamp the save with an authoritative Peru timestamp
  // and write it.
  const persistTournament = useCallback(async (tournamentToSave: Tournament): Promise<boolean> => {
    try {
      const checkResponse = await fetch(NPOINT_URL, { cache: 'no-store' });
      if (checkResponse.ok) {
        const remoteData = await checkResponse.json();
        if (isValidTournamentPayload(remoteData) && isFechaGuardadoNewer(remoteData.fechaGuardado, lastSyncedFechaGuardadoRef.current)) {
          setIsUpdatingToLatest(true);
          lastSyncedFechaGuardadoRef.current = remoteData.fechaGuardado ?? null;
          skipNextAutosaveRef.current = true;
          setTournament(remoteData);
          setViewingRound(null);
          setTimeout(() => setIsUpdatingToLatest(false), 1500);
          return false;
        }
      }

      const fechaGuardado = await getPeruTimestamp();
      const finalTournament: Tournament = { ...tournamentToSave, fechaGuardado };

      const saveResponse = await fetch(NPOINT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalTournament),
      });

      if (saveResponse.ok) {
        lastSyncedFechaGuardadoRef.current = fechaGuardado;
        skipNextAutosaveRef.current = true;
        setTournament(finalTournament);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al guardar el torneo:', error);
      return false;
    }
  }, []);

  const forceSaveTournament = useCallback(async (): Promise<boolean> => {
    if (!tournamentRef.current) return false;
    return persistTournament(tournamentRef.current);
  }, [persistTournament]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  useEffect(() => {
    // Always consume the flag exactly once per tournament change, whichever branch below
    // ends up taking - otherwise a fetch-triggered update could leave it set and cause the
    // next *real* edit to silently skip its autosave.
    const shouldSkip = skipNextAutosaveRef.current;
    skipNextAutosaveRef.current = false;

    if (isInitialMount.current) {
      if (tournament) isInitialMount.current = false;
      return;
    }
    if (!tournament || shouldSkip) return;

    const handler = setTimeout(() => {
      persistTournament(tournamentRef.current!);
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [tournament, persistTournament]);

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
    // Shuffle helper
    const shuffleArray = <T,>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    // Build points, past-opponents and bye history from existing rounds once.
    const pointsMap = new Map<string, number>();
    const opponentsMap = new Map<string, Set<string>>();
    const byeRoundIndices = new Map<string, Set<number>>();

    players.forEach(p => {
      pointsMap.set(p.id, 0);
      opponentsMap.set(p.id, new Set<string>());
      byeRoundIndices.set(p.id, new Set<number>());
    });

    existingRounds.forEach((round, roundIndex) => {
      if (!round || !round.matches) return;
      round.matches.forEach(match => {
        if (match.playerId2 === null) {
          byeRoundIndices.get(match.playerId1)?.add(roundIndex);
          if (round.status === 'finished') {
            pointsMap.set(match.playerId1, (pointsMap.get(match.playerId1) || 0) + 3);
          }
          return;
        }

        opponentsMap.get(match.playerId1)?.add(match.playerId2);
        opponentsMap.get(match.playerId2)?.add(match.playerId1);

        if (match.wonGamesPlayer1 === 2) {
          pointsMap.set(match.playerId1, (pointsMap.get(match.playerId1) || 0) + 3);
        } else if (match.wonGamesPlayer2 === 2) {
          pointsMap.set(match.playerId2, (pointsMap.get(match.playerId2) || 0) + 3);
        }
      });
    });

    // Rank by points desc; shuffle first so ties (e.g. round 1, or equal records) break randomly
    // since Array.sort is stable in modern JS engines.
    const sortedPlayers = shuffleArray(players).sort(
      (a, b) => (pointsMap.get(b.id) || 0) - (pointsMap.get(a.id) || 0)
    );

    const pairings: Match[] = [];
    let pool = [...sortedPlayers];

    // Bye assignment for an odd number of players.
    if (pool.length % 2 !== 0) {
      const lastRoundIndex = existingRounds.length - 1;
      const hadByeLastRound = (playerId: string) =>
        lastRoundIndex >= 0 && !!byeRoundIndices.get(playerId)?.has(lastRoundIndex);
      const neverHadBye = (playerId: string) => (byeRoundIndices.get(playerId)?.size || 0) === 0;

      // Prefer the lowest-ranked player who has never had a bye and didn't just have one.
      let byeIndex = -1;
      for (let i = pool.length - 1; i >= 0; i--) {
        if (neverHadBye(pool[i].id) && !hadByeLastRound(pool[i].id)) {
          byeIndex = i;
          break;
        }
      }
      // Otherwise, anyone who at least didn't have the bye in the immediately preceding round
      // (a player must never receive two consecutive byes).
      if (byeIndex === -1) {
        for (let i = pool.length - 1; i >= 0; i--) {
          if (!hadByeLastRound(pool[i].id)) {
            byeIndex = i;
            break;
          }
        }
      }
      // Last resort (only possible if every remaining player just had the bye, i.e. pool of 1).
      if (byeIndex === -1) byeIndex = pool.length - 1;

      const [byePlayer] = pool.splice(byeIndex, 1);
      pairings.push({ playerId1: byePlayer.id, playerId2: null, wonGamesPlayer1: 2, wonGamesPlayer2: 0, isSubmitted: true });
    }

    // Pair remaining players via backtracking: never repeat a matchup, and prefer players
    // close together in the rank-sorted pool (i.e. similar performance) by trying them first.
    const pairUp = (remaining: Player[]): Match[] | null => {
      if (remaining.length === 0) return [];
      const [first, ...rest] = remaining;
      for (let i = 0; i < rest.length; i++) {
        const candidate = rest[i];
        if (!opponentsMap.get(first.id)?.has(candidate.id)) {
          const next = [...rest.slice(0, i), ...rest.slice(i + 1)];
          const result = pairUp(next);
          if (result !== null) {
            return [{ playerId1: first.id, playerId2: candidate.id, wonGamesPlayer1: 0, wonGamesPlayer2: 0, isSubmitted: false }, ...result];
          }
        }
      }
      return null;
    };

    let matches = pairUp(pool);

    if (matches === null) {
      // Extremely constrained field (everyone has already played everyone at this point value).
      // Fall back to minimizing repeats instead of failing to produce a round at all.
      console.warn('swissPair: no rematch-free pairing exists for this round; allowing a repeat matchup as a last resort.');
      matches = [];
      let remaining = [...pool];
      while (remaining.length > 1) {
        const p1 = remaining.shift()!;
        let idx = remaining.findIndex(p => !opponentsMap.get(p1.id)?.has(p.id));
        if (idx === -1) idx = 0;
        const [p2] = remaining.splice(idx, 1);
        matches.push({ playerId1: p1.id, playerId2: p2.id, wonGamesPlayer1: 0, wonGamesPlayer2: 0, isSubmitted: false });
      }
    }

    pairings.push(...matches);
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
    if (tournament.rounds.length >= getRecommendedRounds(tournament.players.length)) return;

    const newTournament = produce(tournament, draft => {
      if (!draft) return;
      const newRoundMatches = swissPair(draft.players, draft.rounds);
      draft.rounds.push({ matches: newRoundMatches, status: 'started' });
    });

    setTournament(newTournament);
    setViewingRound(null);

    // Save immediately (rather than waiting for the debounced autosave) so the next round
    // is visible to other devices right away; goes through the same conflict-checked path.
    persistTournament(newTournament).catch(error => {
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
        draft.rounds.length = roundIndex + 1;
        const roundToEdit = draft.rounds[roundIndex];
        if (!roundToEdit) return;
        roundToEdit.status = 'started';
        roundToEdit.matches.forEach(match => {
            if (match.playerId2 !== null) { 
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
    if(tournament.status !== 'running' && tournament.status !== 'finished') return [];
    const roundNumberForView = viewingRound || tournament.rounds.length;
    const roundIndex = roundNumberForView - 1;
    if (roundIndex < 0 || roundIndex >= tournament.rounds.length) return [];
    const roundToDisplay = tournament.rounds[roundIndex];
    if (!roundToDisplay || !roundToDisplay.matches) return [];
    const playerMap = new Map(tournament.players.map(p => [p.id, p]));

    // Opponents each player faced in rounds strictly before the one being displayed.
    const priorOpponents = new Map<string, Set<string>>();
    for (let i = 0; i < roundIndex; i++) {
      const round = tournament.rounds[i];
      if (!round || !round.matches) continue;
      round.matches.forEach(m => {
        if (m.playerId2 === null) return;
        if (!priorOpponents.has(m.playerId1)) priorOpponents.set(m.playerId1, new Set());
        if (!priorOpponents.has(m.playerId2)) priorOpponents.set(m.playerId2, new Set());
        priorOpponents.get(m.playerId1)!.add(m.playerId2);
        priorOpponents.get(m.playerId2)!.add(m.playerId1);
      });
    }

    return roundToDisplay.matches.map(match => {
        const p1 = playerMap.get(match.playerId1);
        if (!p1) return null;
        const p2 = match.playerId2 ? playerMap.get(match.playerId2) : null;
        const isSubmitted = !!match.isSubmitted;
        const isRematch = !!match.playerId2 && !!priorOpponents.get(match.playerId1)?.has(match.playerId2);
        return {
            player1: p1,
            player2: p2 ? p2 : { id: 'bye', name: 'BYE' },
            isSubmitted: isSubmitted,
            isRematch,
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
    if (!currentRound) return false; 
    return currentRound.status === 'finished';
  }, [tournament]);

  const recommendedRounds = useMemo(
    () => getRecommendedRounds(tournament?.players.length || 0),
    [tournament?.players.length]
  );

  const value: TournamentContextType = {
    tournament,
    standings,
    currentPairings,
    recommendedRounds,
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
          {isUpdatingToLatest && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
              <div className="flex flex-col items-center gap-3 rounded-lg border bg-background p-6 shadow-lg text-center max-w-sm mx-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="font-semibold">Actualizando…</p>
                <p className="text-sm text-muted-foreground">
                  Se encontró una versión más reciente del torneo guardada desde otro dispositivo. Actualizando a la versión actual.
                </p>
              </div>
            </div>
          )}
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
