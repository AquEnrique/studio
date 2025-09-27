import Image from 'next/image';
import type { Card } from '@/lib/types';
import { CardTypeIcon } from './card-type-icon';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import { Separator } from './ui/separator';

interface CardDetailPopoverProps {
  card: Card;
  onRemoveCard: () => void;
}

export function CardDetailPopover({ card, onRemoveCard }: CardDetailPopoverProps) {
  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <h4 className="font-medium leading-none">{card.name}</h4>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CardTypeIcon type={card.type} />
            <span>{card.type}</span>
        </div>
      </div>
      <div className="grid gap-2">
        {card.type.includes('Monster') && (
            <>
                <div className="flex items-center gap-4 font-mono text-xs">
                    {card.level && <span>LVL/ {card.level}</span>}
                    <span>ATK/ {card.atk ?? '?'}</span>
                    <span>DEF/ {card.def ?? '?'}</span>
                    {card.attribute && <span>{card.attribute}</span>}
                </div>
                {card.race && <p className='text-xs text-muted-foreground'>{card.race}</p>}
                <Separator />
            </>
        )}
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {card.desc}
        </p>
        <Separator />
        <Button 
            variant="destructive" 
            size="sm"
            onClick={onRemoveCard}
        >
            <Trash2 className="w-4 h-4 mr-2" />
            Remove from Deck
        </Button>
      </div>
    </div>
  )
}
