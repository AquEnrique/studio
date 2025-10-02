
export interface CardImage {
  id: number;
  image_url: string;
  image_url_small: string;
  image_url_cropped: string;
}

export interface Card {
  id: number;
  instanceId?: number;
  name: string;
  type: string;
  frameType: string;
  desc: string;
  atk?: number;
  def?: number;
  level?: number;
  race?: string;
  attribute?: string;
  card_images: CardImage[];
  value?: number;
}

export type DeckType = 'main' | 'extra' | 'side';

export interface DeckValidation {
  isValid: boolean;
  feedback: string;
}

export interface Interaction {
  cardInstanceId: number;
  action: 'add' | 'remove';
}

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
