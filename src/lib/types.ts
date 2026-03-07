
// Core data model for the tournament state
export type Player = {
  id: string;
  name: string;
};

export type Match = {
  playerId1: string;
  // playerId2 being null means player1 has a bye for this match.
  playerId2: string | null;
  wonGamesPlayer1: number;
  wonGamesPlayer2: number;
};

export type Round = Match[];

export type Tournament = {
  players: Player[];
  rounds: Round[];
  status: 'registration' | 'running' | 'finished';
};


// View model for the standings table, calculated from the Tournament object
export type StandingsPlayer = {
  playerId: string;
  playerName: string;
  playerPoints: number;
  opponentTotalPoints: number;
  gameWinPercentage: number;
  // For simple standings table
  roundResults: (number | 'bye' | null)[];
};


// Types used by components for displaying and creating pairings for a round
export type DisplayPairing = {
  player1: Player;
  player2: Player | { id: 'bye'; name: 'BYE' };
  result?: {
    p1Games: string;
    p2Games: string;
  }
  isSubmitted: boolean;
};

export type ManualPairing = {
  player1: Player;
  player2: Player | { id: 'bye'; name: 'BYE' };
};

