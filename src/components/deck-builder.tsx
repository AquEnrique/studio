'use client';

import { useState, useEffect, useRef } from 'react';
import { Card as CardComponent, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from './ui/scroll-area';
import type { Card, DeckType, Interaction } from '@/lib/types';
import { Trash2, ArrowUpDown, Gem, FileText, Download, Upload } from 'lucide-react';
import Image from 'next/image';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CardDetailPopover } from './card-detail-popover';

interface DeckBuilderProps {
  decks: { main: Card[]; extra: Card[]; side: Card[] };
  totalDeckValue: number;
  onDrop: (e: React.DragEvent, targetDeck: DeckType | 'trash') => void;
  onDragStart: (e: React.DragEvent, card: Card, source: DeckType, index: number) => void;
  addMode: 'main-extra' | 'side';
  setAddMode: (mode: 'main-extra' | 'side') => void;
  onCardRemove: (card: Card, deck: DeckType) => void;
  onCardAdd: (card: Card) => void;
  onSort: () => void;
  onClear: () => void;
  lastInteraction: Interaction | null;
  onYdkUpload: (file: File) => void;
}


export function DeckBuilder({ decks, totalDeckValue, onDrop, onDragStart, addMode, setAddMode, onCardRemove, onCardAdd, onSort, onClear, lastInteraction, onYdkUpload }: DeckBuilderProps) {
  const [isDragOverTrash, setIsDragOverTrash] = useState(false);
  const [animationState, setAnimationState] = useState<Interaction | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (lastInteraction) {
      setAnimationState(lastInteraction);
      const timer = setTimeout(() => {
        setAnimationState(null);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [lastInteraction]);

  const handleDownloadTxt = () => {
    const deckSections = {
      main: decks.main,
      extra: decks.extra,
      side: decks.side,
    };

    let content = `Total Deck Value: ${totalDeckValue}\n\n`;

    for (const [deckName, deckCards] of Object.entries(deckSections)) {
      content += `---------- ${deckName.toUpperCase()} DECK (${deckCards.length}) ----------\n`;
      
      const cardCounts: { [key: string]: { count: number; value?: number } } = {};
      deckCards.forEach(card => {
        if (!cardCounts[card.name]) {
          cardCounts[card.name] = { count: 0, value: card.value };
        }
        cardCounts[card.name].count++;
      });

      Object.entries(cardCounts).forEach(([cardName, { count, value }]) => {
        content += `${count}x ${cardName}`;
        if (value && value > 0) {
          content += ` (Value: ${value})`;
        }
        content += '\n';
      });
      
      content += '\n';
    }
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ygo-deck.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadYdk = () => {
    let content = '#created by YGDeck Builder\n';

    content += '#main\n';
    decks.main.forEach(card => {
      content += `${card.id}\n`;
    });

    content += '#extra\n';
    decks.extra.forEach(card => {
      content += `${card.id}\n`;
    });

    content += '!side\n';
    decks.side.forEach(card => {
      content += `${card.id}\n`;
    });

    const blob = new Blob([content], { type: 'application/octet-stream;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'deck.ydk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onYdkUpload(file);
    }
    // Reset file input value to allow uploading the same file again
    if(event.target) {
        event.target.value = '';
    }
  };


  const renderDeckContent = (deckType: DeckType) => {
    const deck = decks[deckType];
    const max = { main: 60, extra: 15, side: 15 }[deckType];

    return (
      <div 
        className="flex flex-col border-dashed border-2 border-transparent rounded-lg p-2 transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onDrop(e, deckType)}
      >
        <div className="flex justify-between items-center mb-2 px-2">
            <span className="font-semibold text-lg">{deckType.charAt(0).toUpperCase() + deckType.slice(1)} Deck</span>
            <span className="font-mono text-sm text-muted-foreground">{`${deck.length} / ${max}`}</span>
        </div>
           <div className="grid gap-2 pr-2" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(65px, 1fr))'}}>
            {deck.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground pt-8">
                <p>Drag cards here</p>
              </div>
            ) : (
              deck.map((card, index) => {
                const isAnimated = animationState?.cardInstanceId === card.instanceId;
                let animationClass = '';
                if (isAnimated) {
                  animationClass = animationState?.action === 'add' ? 'animate-shine' : 'animate-shine-red';
                }
                const otherCopiesInDeck = [...decks.main, ...decks.extra, ...decks.side].filter(c => c.name === card.name && c.instanceId !== card.instanceId).length > 0;
                
                return (
                  <Popover key={card.instanceId || `${card.id}-${index}`} openDelay={200} >
                    <PopoverTrigger asChild>
                      <div
                        draggable
                        onDragStart={(e) => onDragStart(e, card, deckType, index)}
                        className={`relative group cursor-pointer aspect-[59/86] ${animationClass}`}
                      >
                        <Image
                          src={card.card_images[0].image_url}
                          alt={card.name}
                          fill
                          sizes="(max-width: 768px) 15vw, 65px"
                          className="object-cover rounded-md"
                        />
                        {card.value ? (
                          card.value > 0 ? (
                            <div className="absolute top-1 right-1 bg-primary/80 text-primary-foreground text-[10px] font-bold px-1 py-0.5 rounded-sm flex items-center gap-1 backdrop-blur-sm">
                              <Gem className="w-2 h-2" />
                              {card.value}
                            </div>
                           ) : (
                            <div className="absolute top-1 right-1 bg-green-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 backdrop-blur-sm z-10">
                                Free
                            </div>
                           )
                        ) : null}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" side="left" align="start" alignOffset={-10}>
                       <CardDetailPopover 
                         card={card} 
                         onRemoveCard={() => onCardRemove(card, deckType)}
                         onAddCard={onCardAdd}
                         keepOpenOnRemove={otherCopiesInDeck}
                       />
                    </PopoverContent>
                  </Popover>
              )})
            )}
          </div>
      </div>
    );
  };
  
  return (
    <CardComponent className="flex flex-col h-full shadow-lg">
       <CardHeader className="flex-row items-center justify-between pb-2 shrink-0">
        <div className="flex items-center gap-4">
            <CardTitle>Deck Builder</CardTitle>
        </div>
        <div className="flex items-center gap-2">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".ydk"
                className="hidden"
            />
            <Button variant="outline" size="icon" onClick={handleUploadClick} aria-label="Upload YDK"><Upload /></Button>
            <Button variant="outline" size="icon" onClick={onSort} aria-label="Sort Deck"><ArrowUpDown /></Button>
            <Button variant="outline" size="icon" onClick={handleDownloadYdk} aria-label="Download as YDK"><FileText /></Button>
            <Button variant="outline" size="icon" onClick={handleDownloadTxt} aria-label="Download as TXT"><Download /></Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" aria-label="Clear Deck"><Trash2 /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your
                    entire deck.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onClear}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-hidden p-4 pt-0 min-h-0">
        <div className="shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-mono text-sm">
                <Gem className={`w-4 h-4 ${totalDeckValue >= 101 ? 'text-red-500' : 'text-muted-foreground'}`}/>
                <span className={`${totalDeckValue >= 101 ? 'text-red-500' : 'text-muted-foreground'}`}>Total Value:</span>
                <span className={`font-bold ${totalDeckValue >= 101 ? 'text-red-500' : 'text-muted-foreground'}`}>{totalDeckValue}</span>
              </div>
              <RadioGroup 
                defaultValue="main-extra" 
                value={addMode} 
                onValueChange={(value) => setAddMode(value as 'main-extra' | 'side')}
                className="flex items-center gap-4"
              >
                <Label className="text-sm font-medium">Target Deck:</Label>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="main-extra" id="main-extra" />
                  <Label htmlFor="main-extra">Main/Extra</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="side" id="side" />
                  <Label htmlFor="side">Side</Label>
                </div>
              </RadioGroup>
            </div>
        </div>
        
        <div className="flex-grow flex flex-col min-h-0 bg-card p-2 rounded-md">
          <ScrollArea className="flex-grow rounded-md border -mr-4 pr-4">
              <div className="space-y-4 p-2">
                {renderDeckContent('main')}
                {renderDeckContent('extra')}
                {renderDeckContent('side')}
              </div>
          </ScrollArea>
        </div>
        
        <div className="shrink-0 mt-4">
            <div
                onDrop={(e) => { onDrop(e, 'trash'); setIsDragOverTrash(false); }}
                onDragOver={(e) => { e.preventDefault(); setIsDragOverTrash(true); }}
                onDragLeave={() => setIsDragOverTrash(false)}
                className={`flex items-center justify-center p-4 border-2 border-dashed rounded-lg text-muted-foreground transition-colors ${
                isDragOverTrash ? 'border-destructive bg-destructive/20 text-destructive-foreground' : ''
                }`}
            >
                <Trash2 className="h-6 w-6 mr-2" /> Drag a card here to remove it
            </div>
        </div>
      </CardContent>
    </CardComponent>
  );
}
