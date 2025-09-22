'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Card, DeckType, DeckValidation } from '@/lib/types';
import { getDeckValidation } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { CardSearch } from '@/components/card-search';
import { DeckBuilder } from '@/components/deck-builder';

const EXTRA_DECK_TYPES = [
  'Fusion Monster',
  'Synchro Monster',
  'XYZ Monster',
  'Link Monster',
  'Synchro Tuner Monster',
  'XYZ Pendulum Effect Monster',
  'Synchro Pendulum Effect Monster',
  'Fusion Pendulum Effect Monster',
];

export default function Home() {
  const [mainDeck, setMainDeck] = useState<Card[]>([]);
  const [extraDeck, setExtraDeck] = useState<Card[]>([]);
  const [sideDeck, setSideDeck] = useState<Card[]>([]);
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<DeckValidation | null>(null);
  const [activeDeckTab, setActiveDeckTab] = useState<DeckType>('main');
  const { toast } = useToast();

  const allDecks = useMemo(() => ({
    main: mainDeck,
    extra: extraDeck,
    side: sideDeck,
  }), [mainDeck, extraDeck, sideDeck]);

  useEffect(() => {
    const validate = async () => {
      try {
        const result = await getDeckValidation({
          mainDeckSize: mainDeck.length,
          extraDeckSize: extraDeck.length,
          sideDeckSize: sideDeck.length,
        });
        setValidation(result);
      } catch (error) {
        console.error('Validation failed:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to get deck validation from AI.',
        });
      }
    };
    validate();
  }, [mainDeck, extraDeck, sideDeck, toast]);
  
  const handleSearch = async (term: string) => {
    if (!term) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(term)}`
      );
       if (!response.ok) {
        if (response.status === 400) {
            const errorData = await response.json();
             toast({
                variant: 'destructive',
                title: 'No cards found',
                description: errorData.error || `No cards matching "${term}" were found.`,
            });
            setSearchResults([]);
        } else {
            throw new Error('Network response was not ok');
        }
      } else {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
            setSearchResults(data.data);
        } else {
            toast({
            variant: 'destructive',
            title: 'No cards found',
            description: `No cards matching "${term}" were found.`,
            });
            setSearchResults([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
      toast({
        variant: 'destructive',
        title: 'Search Error',
        description: 'Could not fetch cards. Please try again later.',
      });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (card: Card) => {
    const cardCount = [...mainDeck, ...extraDeck, ...sideDeck].filter(c => c.name === card.name).length;
    if (cardCount >= 3) {
      toast({
        variant: 'destructive',
        title: 'Card Limit Reached',
        description: `You can only have 3 copies of "${card.name}".`,
      });
      return;
    }
    
    const isExtraDeckCard = EXTRA_DECK_TYPES.includes(card.type);
    let targetDeck: DeckType;

    if (activeDeckTab === 'side') {
      targetDeck = 'side';
    } else {
        if (isExtraDeckCard) {
            targetDeck = 'extra';
        } else {
            targetDeck = 'main';
        }
    }

    const targetSetter = {
      main: setMainDeck,
      extra: setExtraDeck,
      side: setSideDeck,
    }[targetDeck];

    targetSetter(prev => [...prev, card]);
    toast({ title: 'Card Added', description: `Added ${card.name} to your ${targetDeck} deck.` });
  };
  
  const removeCardFromDeck = (card: Card, deck: DeckType, index: number) => {
    const deckSetter = {
      main: setMainDeck,
      extra: setExtraDeck,
      side: setSideDeck,
    }[deck];

    deckSetter(prev => prev.filter((c, i) => i !== index));
    toast({ title: 'Card Removed', description: `Removed ${card.name} from your ${deck} deck.` });
  };

  const handleDragStart = (e: React.DragEvent, card: Card, source: DeckType | 'search') => {
    const data = JSON.stringify({ card, source });
    e.dataTransfer.setData('application/json', data);
  };

  const handleDrop = (e: React.DragEvent, targetDeck: DeckType | 'trash') => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    const transferData = JSON.parse(data);
    const { card, source }: { card: Card; source: DeckType | 'search' } = transferData;

    if (source !== 'search') {
      const sourceSetter = {
        main: setMainDeck,
        extra: setExtraDeck,
        side: setSideDeck,
      }[source];
      sourceSetter(prev => prev.filter(c => c.id !== card.id));
    }

    if (targetDeck === 'trash') {
        toast({ title: 'Card Removed', description: `Removed ${card.name} from your deck.`});
        return;
    }

    const targetSetter = {
      main: setMainDeck,
      extra: setExtraDeck,
      side: setSideDeck,
    }[targetDeck];

    const isExtraDeckCard = EXTRA_DECK_TYPES.includes(card.type);

    if (targetDeck === 'main' && isExtraDeckCard) {
      targetDeck = 'extra';
    } else if (targetDeck === 'extra' && !isExtraDeckCard) {
      targetDeck = 'main';
    }

    const cardCount = [...mainDeck, ...extraDeck, ...sideDeck].filter(c => c.name === card.name).length;

    if (cardCount >= 3) {
      toast({
        variant: 'destructive',
        title: 'Card Limit Reached',
        description: `You can only have 3 copies of "${card.name}".`,
      });
      if (source !== 'search') {
          const sourceSetterReAdd = { main: setMainDeck, extra: setExtraDeck, side: setSideDeck }[source];
          sourceSetterReAdd(prev => [...prev, card]);
      }
      return;
    }

    const actualSetter = {
        main: setMainDeck,
        extra: setExtraDeck,
        side: setSideDeck,
    }[targetDeck];
    
    actualSetter(prev => [...prev, card]);
    toast({ title: 'Card Added', description: `Added ${card.name} to your ${targetDeck} deck.`});
  };

  return (
    <div className="flex flex-col lg:h-screen bg-background text-foreground font-body">
      <Header />
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-5 gap-4 p-4 lg:overflow-hidden">
        <div className="lg:col-span-2 flex flex-col h-full lg:overflow-hidden min-h-[50vh]">
          <CardSearch 
            onSearch={handleSearch} 
            results={searchResults} 
            isLoading={isLoading} 
            onDragStart={handleDragStart} 
            onCardClick={handleCardClick}
          />
        </div>
        <div className="lg:col-span-3 flex flex-col h-full lg:overflow-hidden min-h-[80vh]">
          <DeckBuilder
            decks={allDecks}
            validation={validation}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            activeTab={activeDeckTab}
            setActiveTab={setActiveDeckTab}
            onCardClick={removeCardFromDeck}
          />
        </div>
      </main>
    </div>
  );
}
