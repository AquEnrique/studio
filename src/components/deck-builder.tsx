'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card as CardComponent, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from './ui/scroll-area';
import { CardDisplay } from './card-display';
import type { Card, DeckType, DeckValidation } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Lightbulb, CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface DeckBuilderProps {
  decks: { main: Card[]; extra: Card[]; side: Card[] };
  validation: DeckValidation | null;
  onDrop: (e: React.DragEvent<HTMLDivElement>, targetDeck: DeckType | 'trash') => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, card: Card, source: DeckType) => void;
}

export function DeckBuilder({ decks, validation, onDrop, onDragStart }: DeckBuilderProps) {
  const [isDragOverTrash, setIsDragOverTrash] = useState(false);

  const renderDeckContent = (deckType: DeckType) => {
    const deck = decks[deckType];
    const max = { main: 60, extra: 15, side: 15 }[deckType];
    const min = { main: 40, extra: 0, side: 0 }[deckType];

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
          <div className="space-y-2 pr-2">
            {deck.length === 0 ? (
              <div className="text-center text-muted-foreground pt-8">
                <p>Drag cards here</p>
              </div>
            ) : (
              deck.map((card, index) => (
                <div
                  key={`${card.id}-${index}`}
                  draggable
                  onDragStart={(e) => onDragStart(e, card, deckType)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <CardDisplay card={card} />
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
      <CardHeader>
        <CardTitle>Deck Builder</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col overflow-hidden p-4 pt-0">
        <Tabs defaultValue="main" className="flex-grow flex flex-col">
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
