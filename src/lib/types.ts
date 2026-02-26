
// Tournament Types
export type MatchResult = 'win' | 'loss' | 'draw';

export type Match = {
  round: number;
  opponentId: string;
  result: MatchResult;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
};

export type Player = {
  id: string;
  name: string;
  points: number;
  matches: Match[];
  opponentIds: string[];
  gameWins: number;
  gamesPlayed: number;
};

export type ManualPairing = {
    player1: Player;
    player2: Player | { id: 'bye'; name: 'BYE' };
};

export type Pairing = {
  player1: Player | StandingsPlayer;
  player2: Player | StandingsPlayer | { id: 'bye'; name: 'BYE' };
};

export interface RoundHistory {
    pairings: Pairing[];
    players: Player[];
}

export type TournamentState = {
  players: Player[];
  currentRound: number;
  pairings: Pairing[];
  status: 'registration' | 'running' | 'finished';
  history: { [round: number]: RoundHistory };
  viewingRound: number | null;
};

export type StandingsPlayer = Player & {
    omwPercentage: number;
    gwPercentage: number;
    ogwPercentage: number;
};
