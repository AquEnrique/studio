'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Card, DeckType, Interaction } from '@/lib/types';
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
  const [lastInteraction, setLastInteraction] = useState<Interaction | null>(null);
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
    }
  }, []);

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
      }
    };
    validate();
  }, [mainDeck, extraDeck, sideDeck]);
  
  const handleSearch = async (term: string) => {
    if (term.length < 4) {
      setSearchResults([]);
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
            setSearchResults([]);
          }
        } else {
            setSearchResults([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (card: Card) => {
    const cardCount = [...mainDeck, ...extraDeck, ...sideDeck].filter(c => c.name === card.name).length;
    if (cardCount >= 3) {
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

    const newCard = { ...card, instanceId: Date.now() };
    targetSetter(prev => [...prev, newCard]);
    setLastInteraction({ cardInstanceId: newCard.instanceId, action: 'add' });
  };
  
  const removeCardFromDeck = (card: Card, deck: DeckType, index: number) => {
    const deckSetter = {
      main: setMainDeck,
      extra: setExtraDeck,
      side: setSideDeck,
    }[deck];

    setLastInteraction({ cardInstanceId: card.instanceId!, action: 'remove' });
    setTimeout(() => {
        deckSetter(prev => prev.filter((c) => c.instanceId !== card.instanceId));
    }, 500);
  };

  const handleDragStart = (e: React.DragEvent, card: Card, source: DeckType | 'search', index?: number) => {
    const cardWithInstanceId = source === 'search' ? { ...card, instanceId: Date.now() } : card;
    const data = JSON.stringify({ card: cardWithInstanceId, source, index });
    e.dataTransfer.setData('text/plain', data);
  };

  const handleDrop = (e: React.DragEvent, targetDeck: DeckType | 'trash') => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    const { card, source, index }: { card: Card; source: DeckType | 'search', index?: number } = JSON.parse(data);

    if (source !== 'search' && index !== undefined) {
      const sourceSetter = {
        main: setMainDeck,
        extra: setExtraDeck,
        side: setSideDeck,
      }[source];
      sourceSetter(prev => prev.filter((c) => c.instanceId !== card.instanceId));
    }

    if (targetDeck === 'trash') {
        setLastInteraction({ cardInstanceId: card.instanceId!, action: 'remove' });
        return;
    }

    const isExtraDeckCard = EXTRA_DECK_TYPES.includes(card.type);
    let actualTargetDeck = targetDeck;

    if (targetDeck === 'main' && isExtraDeckCard) actualTargetDeck = 'extra';
    if (targetDeck === 'extra' && !isExtraDeckCard) actualTargetDeck = 'main';
    
    const allCards = [...mainDeck, ...extraDeck, ...sideDeck];
    if (source !== 'search') {
      const cardIndexInAll = allCards.findIndex(c => c.instanceId === card.instanceId);
      if(cardIndexInAll > -1) allCards.splice(cardIndexInAll, 1);
    }
    
    const cardCount = allCards.filter(c => c.name === card.name).length;

    if (cardCount >= 3) {
      if (source !== 'search') {
          const sourceSetterReAdd = { main: setMainDeck, extra: setExtraDeck, side: setSideDeck }[source];
          sourceSetterReAdd(prev => [...prev, card].sort((a,b) => (a.instanceId || 0) - (b.instanceId || 0)));
      }
      return;
    }

    const actualSetter = {
        main: setMainDeck,
        extra: setExtraDeck,
        side: setSideDeck,
    }[actualTargetDeck];
    
    actualSetter(prev => [...prev, card]);
    setLastInteraction({ cardInstanceId: card.instanceId!, action: 'add' });
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
  }, [sortDeck]);

  const handleClearDecks = useCallback(() => {
    setMainDeck([]);
    setExtraDeck([]);
    setSideDeck([]);
  }, []);


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
            onClear={handleClearDecks}
            lastInteraction={lastInteraction}
          />
        </div>
      </main>
    </div>
  );
}
