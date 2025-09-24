'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Card, DeckType } from '@/lib/types';
import { getDeckValidation, type DeckValidationOutput } from './actions';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { CardSearch } from '@/components/card-search';
import { DeckBuilder } from '@/components/deck-builder';
import cardValues from '@/lib/card-values.json';

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

const CARD_TYPE_SORT_ORDER = {
  'monster': 1,
  'spell': 2,
  'trap': 3,
};

const cardValueMap: { [key: string]: number } = {};
cardValues.forEach(card => {
  cardValueMap[card.cardName] = card.value;
});

function getCardSortType(card: Card): 'monster' | 'spell' | 'trap' {
    if (card.type.includes('Monster')) return 'monster';
    if (card.type.includes('Spell')) return 'spell';
    if (card.type.includes('Trap')) return 'trap';
    return 'monster'; // Default case
}

export default function Home() {
  const [mainDeck, setMainDeck] = useState<Card[]>([]);
  const [extraDeck, setExtraDeck] = useState<Card[]>([]);
  const [sideDeck, setSideDeck] = useState<Card[]>([]);
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<DeckValidationOutput | null>(null);
  const [addMode, setAddMode] = useState<'main-extra' | 'side'>('main-extra');
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedMainDeck = localStorage.getItem('mainDeck');
      const savedExtraDeck = localStorage.getItem('extraDeck');
      const savedSideDeck = localStorage.getItem('sideDeck');

      if (savedMainDeck) setMainDeck(JSON.parse(savedMainDeck));
      if (savedExtraDeck) setExtraDeck(JSON.parse(savedExtraDeck));
      if (savedSideDeck) setSideDeck(JSON.parse(savedSideDeck));
    } catch (error) {
      console.error("Failed to load deck from localStorage", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load your previously saved deck.',
      });
    }
  }, [toast]);

  useEffect(() => {
    try {
      localStorage.setItem('mainDeck', JSON.stringify(mainDeck));
    } catch (error) {
       console.error("Failed to save main deck to localStorage", error);
    }
  }, [mainDeck]);

  useEffect(() => {
    try {
      localStorage.setItem('extraDeck', JSON.stringify(extraDeck));
    } catch (error) {
      console.error("Failed to save extra deck to localStorage", error);
    }
  }, [extraDeck]);

  useEffect(() => {
    try {
      localStorage.setItem('sideDeck', JSON.stringify(sideDeck));
    } catch (error) {
      console.error("Failed to save side deck to localStorage", error);
    }
  }, [sideDeck]);


  const allDecks = useMemo(() => ({
    main: mainDeck,
    extra: extraDeck,
    side: sideDeck,
  }), [mainDeck, extraDeck, sideDeck]);

  const totalDeckValue = useMemo(() => {
    return [...mainDeck, ...extraDeck, ...sideDeck].reduce((acc, card) => acc + (card.value || 0), 0);
  }, [mainDeck, extraDeck, sideDeck]);

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
    if (term.length < 4) {
      setSearchResults([]);
       toast({
        variant: 'destructive',
        title: 'Search Term Too Short',
        description: 'Please enter at least 4 characters to search.',
      });
      return;
    }
    setIsLoading(true);
    setIsSearchCollapsed(false);
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
          const cardsWithValues = data.data
            .filter((card: Card) => !card.type.includes('Link') && !card.type.includes('Pendulum'))
            .map((card: Card) => ({
              ...card,
              value: cardValueMap[card.name] || 0,
            }));

          if (cardsWithValues.length > 0) {
            setSearchResults(cardsWithValues);
          } else {
             toast({
              variant: 'destructive',
              title: 'No cards found',
              description: `No cards matching "${term}" were found after filtering.`,
            });
            setSearchResults([]);
          }
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

    if (addMode === 'side') {
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
    e.dataTransfer.setData('text/plain', data);
  };

  const handleDrop = (e: React.DragEvent, targetDeck: DeckType | 'trash') => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
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

    const isExtraDeckCard = EXTRA_DECK_TYPES.includes(card.type);

    if (targetDeck === 'main' && isExtraDeckCard) {
      setExtraDeck(prev => [...prev, card]);
      toast({ title: 'Card Moved', description: `Moved ${card.name} to your extra deck.`});
    } else if (targetDeck === 'extra' && !isExtraDeckCard) {
      setMainDeck(prev => [...prev, card]);
      toast({ title: 'Card Moved', description: `Moved ${card.name} to your main deck.`});
    } else {
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
    }
  };

  const sortDeck = useCallback((deck: Card[]) => {
    return [...deck].sort((a, b) => {
      const typeA = getCardSortType(a);
      const typeB = getCardSortType(b);
      const typeOrderA = CARD_TYPE_SORT_ORDER[typeA];
      const typeOrderB = CARD_TYPE_SORT_ORDER[typeB];

      if (typeOrderA !== typeOrderB) {
        return typeOrderA - typeOrderB;
      }
      return a.name.localeCompare(b.name);
    });
  }, []);

  const handleSortDecks = useCallback(() => {
    setMainDeck(prev => sortDeck(prev));
    setExtraDeck(prev => sortDeck(prev));
    setSideDeck(prev => sortDeck(prev));
    toast({
      title: 'Decks Sorted',
      description: 'Your decks have been sorted by type and name.',
    });
  }, [sortDeck, toast]);


  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-body">
      <Header />
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-5 gap-4 p-4 min-h-0">
        <div className="lg:col-span-2 flex flex-col h-full min-h-0">
          <CardSearch 
            onSearch={handleSearch} 
            results={searchResults} 
            isLoading={isLoading} 
            onDragStart={handleDragStart} 
            onCardClick={handleCardClick}
            isCollapsed={isSearchCollapsed}
            setIsCollapsed={setIsSearchCollapsed}
          />
        </div>
        <div className="lg:col-span-3 flex flex-col h-full min-h-0">
          <DeckBuilder
            decks={allDecks}
            totalDeckValue={totalDeckValue}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            addMode={addMode}
            setAddMode={setAddMode}
            onCardClick={removeCardFromDeck}
            onSort={handleSortDecks}
          />
        </div>
      </main>
    </div>
  );
}

    