import Image from 'next/image';
import type { Card, DeckType } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { CardTypeIcon } from './card-type-icon';
import { Button } from './ui/button';
import { Gem, Ticket, Trash2 } from 'lucide-react';

interface CardDetailDialogProps {
  card: Card;
  deck: DeckType;
  onOpenChange: (isOpen: boolean) => void;
  onRemoveCard: (card: Card, deck: DeckType) => void;
}

export function CardDetailDialog({ card, deck, onOpenChange, onRemoveCard }: CardDetailDialogProps) {
  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col items-center">
            <div className="relative w-full aspect-[59/86]">
                <Image
                    src={card.card_images[0].image_url}
                    alt={card.name}
                    fill
                    className="object-cover rounded-lg"
                    sizes="(max-width: 768px) 80vw, 33vw"
                />
                 {card.value !== undefined && card.value !== null && (
                    <>
                    {card.value > 0 ? (
                        <div className="absolute top-2 right-2 bg-primary/80 text-primary-foreground text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm z-10">
                        <Gem className="w-3 h-3" />
                        {card.value}
                        </div>
                    ) : (
                        <div className="absolute top-2 right-2 bg-green-600/90 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm z-10">
                        <Ticket className="w-3 h-3" />
                        Free
                        </div>
                    )}
                    </>
                )}
            </div>
            <Button 
              variant="destructive" 
              className="mt-4 w-full"
              onClick={() => onRemoveCard(card, deck)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove from Deck
            </Button>
        </div>
        <div className="md:col-span-2">
            <DialogHeader>
                <DialogTitle className="text-2xl">{card.name}</DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                    <CardTypeIcon type={card.type} />
                    <span>{card.type}</span>
                </div>
            </DialogHeader>
            <div className="py-4 space-y-4">
                {card.type.includes('Monster') && (
                    <div className="flex items-center gap-6 font-mono text-sm">
                        {card.level && <span>LVL/ {card.level}</span>}
                        <span>ATK/ {card.atk ?? '?'}</span>
                        <span>DEF/ {card.def ?? '?'}</span>
                        {card.attribute && <span>{card.attribute}</span>}
                        {card.race && <span>{card.race}</span>}
                    </div>
                )}
                <DialogDescription className="text-base leading-relaxed whitespace-pre-wrap">
                    {card.desc}
                </DialogDescription>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
