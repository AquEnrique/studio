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
