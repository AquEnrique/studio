'use client';

import { useState, useRef } from 'react';
import { Card as CardComponent, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from './ui/scroll-area';
import type { Card, DeckType } from '@/lib/types';
import { Trash2, ArrowUpDown, Gem, Download, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { toPng } from 'html-to-image';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

interface DeckBuilderProps {
  decks: { main: Card[]; extra: Card[]; side: Card[] };
  totalDeckValue: number;
  onDrop: (e: React.DragEvent, targetDeck: DeckType | 'trash') => void;
  onDragStart: (e: React.DragEvent, card: Card, source: DeckType) => void;
  addMode: 'main-extra' | 'side';
  setAddMode: (mode: 'main-extra' | 'side') => void;
  onCardClick: (card: Card, deck: DeckType, index: number) => void;
  onSort: () => void;
}


export function DeckBuilder({ decks, totalDeckValue, onDrop, onDragStart, addMode, setAddMode, onCardClick, onSort }: DeckBuilderProps) {
  const [isDragOverTrash, setIsDragOverTrash] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);

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
  
  const handleDownloadJpg = async () => {
    if (deckRef.current === null) {
      return;
    }

    try {
      const dataUrl = await toPng(deckRef.current, { 
        cacheBust: true,
        skipFonts: true,
        backgroundColor: '#303030',
         fetchRequestInit: {
          mode: 'no-cors'
        }
      });
      const link = document.createElement('a');
      link.download = 'ygo-deck.jpg';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('oops, something went wrong!', err);
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
           <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-10 gap-2 pr-2">
            {deck.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground pt-8">
                <p>Drag cards here</p>
              </div>
            ) : (
              deck.map((card, index) => (
                <div
                  key={`${card.id}-${index}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, card, deckType)}
                  onClick={() => onCardClick(card, deckType, index)}
                  className="relative group cursor-pointer aspect-[59/86]"
                >
                  <Image
                    src={card.card_images[0].image_url}
                    alt={card.name}
                    fill
                    sizes="(max-width: 768px) 20vw, (max-width: 1200px) 12.5vw, 10vw"
                    className="object-cover rounded-md"
                  />
                  {card.value && card.value > 0 && (
                    <div className="absolute top-1 right-1 bg-primary/80 text-primary-foreground text-[10px] font-bold px-1 py-0.5 rounded-sm flex items-center gap-1 backdrop-blur-sm">
                      <Gem className="w-2 h-2" />
                      {card.value}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <X className="w-8 h-8 text-white" />
                  </div>
                </div>
              ))
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
            <Button variant="outline" size="icon" className="md:w-auto md:px-3" onClick={onSort}>
                <ArrowUpDown className="md:mr-2" />
                <span className="hidden md:inline">Sort</span>
            </Button>
            <Button variant="outline" size="icon" className="md:w-auto md:px-3" onClick={handleDownloadTxt}>
              <Download className="md:mr-2" />
              <span className="hidden md:inline">TXT</span>
            </Button>
            <Button variant="outline" size="icon" className="md:w-auto md:px-3" onClick={handleDownloadJpg}>
              <ImageIcon className="md:mr-2" />
              <span className="hidden md:inline">JPG</span>
            </Button>
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
        
        <div ref={deckRef} className="flex-grow flex flex-col min-h-0 bg-card p-2 rounded-md">
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

    