import Image from 'next/image';
import type { Card } from '@/lib/types';
import { Card as CardComponent } from './ui/card';
import { CardTypeIcon } from './card-type-icon';
import { Gem, Ticket } from 'lucide-react';

interface CardDisplayProps {
  card: Card;
}

export function CardDisplay({ card }: CardDisplayProps) {
  return (
    <CardComponent className="overflow-hidden bg-card/80 backdrop-blur-sm p-2 hover:bg-card transition-colors relative">
       {card.value !== undefined && card.value !== null && (
         <>
          {card.value > 0 ? (
            <div className="absolute top-1 right-1 bg-primary/80 text-primary-foreground text-[10px] font-bold px-1 py-0.5 rounded-sm flex items-center gap-1 backdrop-blur-sm z-10">
              <Gem className="w-2 h-2" />
              {card.value}
            </div>
          ) : (
            <div className="absolute top-1 right-1 bg-green-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 backdrop-blur-sm z-10">
              <Ticket className="w-2 h-2" />
              Free
            </div>
          )}
         </>
       )}
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
        <div className="flex-grow min-w-0">
          <h3 className="font-semibold text-sm truncate">{card.name}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
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
