import Image from 'next/image';
import type { Card } from '@/lib/types';
import { CardTypeIcon } from './card-type-icon';
import { Button } from './ui/button';
import { Minus, Plus } from 'lucide-react';
import { Separator } from './ui/separator';

interface CardDetailPopoverProps {
  card: Card;
  onRemoveCard: () => void;
  onAddCard: (card: Card) => void;
  keepOpenOnRemove?: boolean;
}

export function CardDetailPopover({ card, onRemoveCard, onAddCard, keepOpenOnRemove = false }: CardDetailPopoverProps) {
    const handleRemoveClick = (e: React.MouseEvent) => {
        if (keepOpenOnRemove) {
            e.preventDefault();
        }
        onRemoveCard();
    }

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-1 relative aspect-[59/86]">
        <Image
          src={card.card_images[0].image_url}
          alt={card.name}
          fill
          className="object-cover rounded-md"
          sizes="100px"
        />
      </div>
      <div className="col-span-2 space-y-2">
        <h4 className="font-medium leading-none">{card.name}</h4>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CardTypeIcon type={card.type} />
            <span>{card.type}</span>
        </div>
         <Separator />
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
            <blockquote className="text-sm text-muted-foreground whitespace-pre-wrap max-h-36 overflow-y-auto bg-muted/50 p-2 rounded-md border-l-4 border-border italic">
              {card.desc}
            </blockquote>
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
                        onClick={handleRemoveClick}
                    >
                        <Minus className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
