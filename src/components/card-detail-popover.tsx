import Image from 'next/image';
import type { Card } from '@/lib/types';
import { CardTypeIcon } from './card-type-icon';
import { Button } from './ui/button';
import { Trash2, Minus, Plus } from 'lucide-react';
import { Separator } from './ui/separator';

interface CardDetailPopoverProps {
  card: Card;
  onRemoveCard: () => void;
  onAddCard: (card: Card) => void;
}

export function CardDetailPopover({ card, onRemoveCard, onAddCard }: CardDetailPopoverProps) {
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
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Manage card:</p>
            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => onAddCard(card)}
                >
                    <Plus className="w-4 h-4" />
                </Button>
                 <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={onRemoveCard}
                >
                    <Minus className="w-4 h-4" />
                </Button>
            </div>
        </div>
      </div>
    </div>
  )
}
