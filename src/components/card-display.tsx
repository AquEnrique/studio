import Image from 'next/image';
import type { Card } from '@/lib/types';
import { Card as CardComponent } from './ui/card';
import { CardTypeIcon } from './card-type-icon';

interface CardDisplayProps {
  card: Card;
}

export function CardDisplay({ card }: CardDisplayProps) {
  return (
    <CardComponent className="overflow-hidden bg-card/80 backdrop-blur-sm p-2 hover:bg-card transition-colors">
      <div className="flex gap-3">
        <div className="relative w-16 h-16 shrink-0">
          <Image
            src={card.card_images[0].image_url_cropped}
            alt={card.name}
            fill
            className="object-cover rounded-md"
            sizes="64px"
          />
        </div>
        <div className="flex-grow">
          <h3 className="font-semibold text-sm truncate">{card.name}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CardTypeIcon type={card.type} />
            <span>{card.type}</span>
          </div>
          {card.type.includes('Monster') && (
            <div className="flex items-center gap-4 text-xs font-mono">
              <span>ATK/ {card.atk ?? '?'}</span>
              <span>DEF/ {card.def ?? '?'}</span>
              {card.level && <span>LVL/ {card.level}</span>}
            </div>
          )}
        </div>
      </div>
    </CardComponent>
  );
}
