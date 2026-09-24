import type {
  DisplayPairing,
  Match,
  Player,
  Round,
  RoundResult,
  StandingsPlayer,
  Tournament,
} from '../models/types';

export const TOURNAMENT_URL = 'https://fortaleza-tcg-default-rtdb.firebaseio.com/torneo.json';

// Firebase drops empty arrays and nulls (e.g. `rounds: []`, bye `playerId2: null`), so the
// tournament is stored as a JSON string. Also accepts a plain object for old/imported data.
export function parseStoredTournament(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const initialTournamentState: Tournament = {
  players: [],
  rounds: [],
  status: 'registration',
};

// Recommended number of Swiss rounds for a given player count: ceil(log2(n)), min 1.
export function getRecommendedRounds(playerCount: number): number {
  if (playerCount < 2) return 0;
  return Math.max(1, Math.ceil(Math.log2(playerCount)));
}

export function isValidTournamentPayload(data: any): data is Tournament {
  return !!data && typeof data === 'object' && Object.keys(data).length > 0 && data.players && data.status && data.rounds;
}

// Newer-than comparison for fechaGuardado strings. A missing/unparseable value never
// counts as "newer" - it just means we don't have proof of a fresher save to defer to.
export function isFechaGuardadoNewer(candidate: string | null | undefined, knownBaseline: string | null): boolean {
  if (!candidate) return false;
  const candidateTime = new Date(candidate).getTime();
  if (Number.isNaN(candidateTime)) return false;
  if (!knownBaseline) return true;
  const knownTime = new Date(knownBaseline).getTime();
  if (Number.isNaN(knownTime)) return true;
  return candidateTime > knownTime;
}

// Helper to calculate standings from the tournament state
export function calculateStandings(tournament: Tournament | null): StandingsPlayer[] {
  if (!tournament || !tournament.players.length) return [];

  const playerStats: {
    [key: string]: {
      points: number;
      opponentIds: string[];
      gamesWon: number;
      gamesPlayed: number;
    };
  } = {};
  const playerMap = new Map(tournament.players.map((p) => [p.id, p.name]));

  tournament.players.forEach((p) => {
    playerStats[p.id] = { points: 0, opponentIds: [], gamesWon: 0, gamesPlayed: 0 };
  });

  tournament.rounds.forEach((round) => {
    if (!round || !round.matches) return;
    round.matches.forEach((match) => {
      if (match.playerId2 === null) {
        if (round.status === 'finished') {
          if (playerStats[match.playerId1]) {
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
      if (totalGames > 0) {
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
  tournament.players.forEach((p) => {
    const stats = playerStats[p.id];
    const gwp = stats.gamesPlayed > 0 ? stats.gamesWon / stats.gamesPlayed : 0;
    playerGwpMap.set(p.id, gwp);
  });

  const standingsPlayers: StandingsPlayer[] = tournament.players.map((p) => {
    const stats = playerStats[p.id];

    const opponentTotalPoints = stats.opponentIds.reduce((total, oppId) => {
      return total + (playerStats[oppId]?.points || 0);
    }, 0);

    const opponentGameWinPercentagesSum = stats.opponentIds.reduce((total, oppId) => {
      const opponentGwp = playerGwpMap.get(oppId) || 0;
      return total + Math.max(opponentGwp, 0.33);
    }, 0);

    const opponentGameWinPercentage =
      stats.opponentIds.length > 0 ? opponentGameWinPercentagesSum / stats.opponentIds.length : 0;

    const gameWinPercentage = playerGwpMap.get(p.id) || 0;

    const roundResults: RoundResult[] = tournament.rounds.map((round) => {
      if (!round || !round.matches) return null;
      const match = round.matches.find((m) => m.playerId1 === p.id || m.playerId2 === p.id);
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
        isBye: false,
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
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Swiss pairing for the next round: never repeats a matchup (backtracking, with a last-resort
// fallback if the field is too constrained), and observes bye rules (no player gets two
// consecutive byes, and byes are spread out before ever repeating on the same player).
export function swissPair(players: Player[], existingRounds: Round[]): Match[] {
  const pointsMap = new Map<string, number>();
  const opponentsMap = new Map<string, Set<string>>();
  const byeRoundIndices = new Map<string, Set<number>>();

  players.forEach((p) => {
    pointsMap.set(p.id, 0);
    opponentsMap.set(p.id, new Set<string>());
    byeRoundIndices.set(p.id, new Set<number>());
  });

  existingRounds.forEach((round, roundIndex) => {
    if (!round || !round.matches) return;
    round.matches.forEach((match) => {
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
  const sortedPlayers = shuffleArray(players).sort((a, b) => (pointsMap.get(b.id) || 0) - (pointsMap.get(a.id) || 0));

  const pairings: Match[] = [];
  let pool = [...sortedPlayers];

  // Bye assignment for an odd number of players.
  if (pool.length % 2 !== 0) {
    const lastRoundIndex = existingRounds.length - 1;
    const hadByeLastRound = (playerId: string) => lastRoundIndex >= 0 && !!byeRoundIndices.get(playerId)?.has(lastRoundIndex);
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
      let idx = remaining.findIndex((p) => !opponentsMap.get(p1.id)?.has(p.id));
      if (idx === -1) idx = 0;
      const [p2] = remaining.splice(idx, 1);
      matches.push({ playerId1: p1.id, playerId2: p2.id, wonGamesPlayer1: 0, wonGamesPlayer2: 0, isSubmitted: false });
    }
  }

  pairings.push(...matches);
  return pairings;
}

// Builds the display-ready pairings (with player objects resolved and rematches flagged)
// for whichever round is currently being viewed.
export function buildCurrentPairings(tournament: Tournament | null, viewingRound: number | null): DisplayPairing[] {
  if (!tournament) return [];
  if (tournament.status !== 'running' && tournament.status !== 'finished') return [];
  const roundNumberForView = viewingRound || tournament.rounds.length;
  const roundIndex = roundNumberForView - 1;
  if (roundIndex < 0 || roundIndex >= tournament.rounds.length) return [];
  const roundToDisplay = tournament.rounds[roundIndex];
  if (!roundToDisplay || !roundToDisplay.matches) return [];
  const playerMap = new Map(tournament.players.map((p) => [p.id, p]));

  // Opponents each player faced in rounds strictly before the one being displayed.
  const priorOpponents = new Map<string, Set<string>>();
  for (let i = 0; i < roundIndex; i++) {
    const round = tournament.rounds[i];
    if (!round || !round.matches) continue;
    round.matches.forEach((m) => {
      if (m.playerId2 === null) return;
      if (!priorOpponents.has(m.playerId1)) priorOpponents.set(m.playerId1, new Set());
      if (!priorOpponents.has(m.playerId2)) priorOpponents.set(m.playerId2, new Set());
      priorOpponents.get(m.playerId1)!.add(m.playerId2);
      priorOpponents.get(m.playerId2)!.add(m.playerId1);
    });
  }

  return roundToDisplay.matches
    .map((match): DisplayPairing | null => {
      const p1 = playerMap.get(match.playerId1);
      if (!p1) return null;
      const p2 = match.playerId2 ? playerMap.get(match.playerId2) : null;
      const isSubmitted = !!match.isSubmitted;
      const isRematch = !!match.playerId2 && !!priorOpponents.get(match.playerId1)?.has(match.playerId2);
      return {
        player1: p1,
        player2: p2 ? p2 : { id: 'bye', name: 'BYE' },
        isSubmitted,
        isRematch,
        result: {
          p1Games: match.wonGamesPlayer1.toString(),
          p2Games: match.wonGamesPlayer2.toString(),
        },
      };
    })
    .filter((p): p is DisplayPairing => p !== null);
}
