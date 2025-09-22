'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card as CardComponent, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from './ui/scroll-area';
import type { Card, DeckType, DeckValidation } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { CheckCircle, XCircle, Trash2, ArrowUpDown, Gem, Download } from 'lucide-react';
import Image from 'next/image';
import { Button } from './ui/button';
import { X } from 'lucide-react';

interface DeckBuilderProps {
  decks: { main: Card[]; extra: Card[]; side: Card[] };
  validation: DeckValidation | null;
  totalDeckValue: number;
  onDrop: (e: React.DragEvent, targetDeck: DeckType | 'trash') => void;
  onDragStart: (e: React.DragEvent, card: Card, source: DeckType) => void;
  activeTab: DeckType;
  setActiveTab: (tab: DeckType) => void;
  onCardClick: (card: Card, deck: DeckType, index: number) => void;
  onSort: () => void;
}

export function DeckBuilder({ decks, validation, totalDeckValue, onDrop, onDragStart, activeTab, setActiveTab, onCardClick, onSort }: DeckBuilderProps) {
  const [isDragOverTrash, setIsDragOverTrash] = useState(false);

  const handleDownload = () => {
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


  const renderDeckContent = (deckType: DeckType) => {
    const deck = decks[deckType];
    const max = { main: 60, extra: 15, side: 15 }[deckType];

    return (
      <div 
        className="flex flex-col h-full border-dashed border-2 border-transparent rounded-lg p-2 transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => onDrop(e, deckType)}
      >
        <div className="flex justify-between items-center mb-2 px-2">
            <span className="font-semibold text-lg">{deckType.charAt(0).toUpperCase() + deckType.slice(1)} Deck</span>
            <span className="font-mono text-sm text-muted-foreground">{`${deck.length} / ${max}`}</span>
        </div>
        <ScrollArea className="flex-grow rounded-md">
           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-2 pr-2">
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
                    sizes="(max-width: 768px) 33vw, (max-width: 1200px) 20vw, 25vw"
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
        </ScrollArea>
      </div>
    );
  };
  
  return (
    <CardComponent className="flex flex-col h-full shadow-lg">
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center gap-4">
            <CardTitle>Deck Builder</CardTitle>
            <div className={`flex items-center gap-2 font-mono text-sm ${totalDeckValue >= 101 ? 'text-red-500' : 'text-muted-foreground'}`}>
                <Gem className="w-4 h-4"/>
                <span>Total Value:</span>
                <span className="font-bold">{totalDeckValue}</span>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onSort}>
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Sort
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-hidden p-4 pt-0">
        <Tabs 
          defaultValue="main" 
          className="flex-grow flex flex-col"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as DeckType)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="main">Main</TabsTrigger>
            <TabsTrigger value="extra">Extra</TabsTrigger>
            <TabsTrigger value="side">Side</TabsTrigger>
          </TabsList>
          <div className="flex-grow mt-2 overflow-hidden">
            <TabsContent value="main" className="h-full m-0">
              {renderDeckContent('main')}
            </TabsContent>
            <TabsContent value="extra" className="h-full m-0">
              {renderDeckContent('extra')}
            </TabsContent>
            <TabsContent value="side" className="h-full m-0">
              {renderDeckContent('side')}
            </TabsContent>
          </div>
        </Tabs>
        <div className="shrink-0 mt-4 space-y-4">
            {validation && (
                <Alert variant={validation.isValid ? 'default' : 'destructive'}>
                {validation.isValid ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertTitle className="font-semibold">
                    {validation.isValid ? 'Deck is Valid' : 'Deck is Invalid'}
                </AlertTitle>
                <AlertDescription>{validation.feedback}</AlertDescription>
                </Alert>
            )}
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
