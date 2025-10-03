
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Card, DeckType, Interaction } from '@/lib/types';
import { getDeckValidation, type DeckValidationOutput } from '../actions';
import { CardSearch } from '@/components/card-search';
import { DeckBuilder } from '@/components/deck-builder';
import cardValues from '@/lib/card-values.json';
import { useIsMobile } from '@/hooks/use-mobile';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CardDetailPopover } from '@/components/card-detail-popover';

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

const EXTRA_DECK_SORT_ORDER = {
    'Fusion Monster': 1,
    'Synchro Monster': 2,
    'Synchro Tuner Monster': 2,
    'Synchro Pendulum Effect Monster': 2,
    'XYZ Monster': 3,
    'XYZ Pendulum Effect Monster': 3,
    'Link Monster': 4,
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
  const isMobile = useIsMobile();

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

  const addCardToDeck = (card: Card) => {
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

  const removeCardFromDeck = (card: Card, deck: DeckType) => {
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
    const { card, source }: { card: Card; source: DeckType | 'search' } = JSON.parse(data);

    if (source !== 'search') {
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


  const sortMainDeck = useCallback((deck: Card[]) => {
    return [...deck].sort((a, b) => {
      const typeA = getCardSortType(a);
      const typeB = getCardSortType(b);
      const typeOrderA = CARD_TYPE_SORT_ORDER[typeA];
      const typeOrderB = CARD_TYPE_SORT_ORDER[typeB];
      
      if (typeOrderA !== typeOrderB) {
        return typeOrderA - typeOrderB;
      }
      
      if (typeA === 'monster') {
        const levelA = a.level || 0;
        const levelB = b.level || 0;
        if (levelA !== levelB) {
          return levelB - levelA; // Sort by level descending
        }
      }
      
      return a.name.localeCompare(b.name);
    });
  }, []);
  
  const sortExtraDeck = useCallback((deck: Card[]) => {
    return [...deck].sort((a, b) => {
      const getExtraDeckSortGroup = (card: Card) => {
        for (const type in EXTRA_DECK_SORT_ORDER) {
          if (card.type.includes(type)) return EXTRA_DECK_SORT_ORDER[type as keyof typeof EXTRA_DECK_SORT_ORDER];
        }
        return 99; // Should not happen
      };
      
      const groupA = getExtraDeckSortGroup(a);
      const groupB = getExtraDeckSortGroup(b);
      
      if (groupA !== groupB) {
        return groupA - groupB;
      }
      
      const levelA = a.level || 0; // Rank for XYZ is in 'level' field
      const levelB = b.level || 0;
      if (levelA !== levelB) {
        return levelB - levelA; // Sort by level/rank descending
      }
      
      return a.name.localeCompare(b.name);
    });
  }, []);

  const handleSortDecks = useCallback(() => {
    setMainDeck(prev => sortMainDeck(prev));
    setExtraDeck(prev => sortExtraDeck(prev));
    setSideDeck(prev => sortMainDeck(prev)); // Side deck uses main deck sorting
  }, [sortMainDeck, sortExtraDeck]);

  const handleClearDecks = useCallback(() => {
    setMainDeck([]);
    setExtraDeck([]);
    setSideDeck([]);
  }, []);

  const handleYdkUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#created by'));
      
      let currentDeck: 'main' | 'extra' | 'side' | null = null;
      const deckIds = {
        main: [] as string[],
        extra: [] as string[],
        side: [] as string[],
      };

      for (const line of lines) {
        if (line === '#main') {
          currentDeck = 'main';
        } else if (line === '#extra') {
          currentDeck = 'extra';
        } else if (line === '!side') {
          currentDeck = 'side';
        } else if (currentDeck && !line.startsWith('#') && !line.startsWith('!')) {
          deckIds[currentDeck].push(line);
        }
      }

      const allIds = [...deckIds.main, ...deckIds.extra, ...deckIds.side].filter(id => id);
      if (allIds.length === 0) return;

      setIsLoading(true);
      try {
        const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${allIds.join(',')}`);
        if (!response.ok) {
          throw new Error('Failed to fetch card data for YDK file');
        }
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          const fetchedCards: Card[] = data.data.map((card: Card) => ({
            ...card,
            value: cardValueMap[card.name] || 0,
          }));

          const cardMap = new Map<string, Card>(fetchedCards.map(c => [c.id.toString(), c]));

          const newMainDeck: Card[] = [];
          deckIds.main.forEach(id => {
            const card = cardMap.get(id);
            if (card) newMainDeck.push({ ...card, instanceId: Date.now() + Math.random() });
          });

          const newExtraDeck: Card[] = [];
          deckIds.extra.forEach(id => {
            const card = cardMap.get(id);
            if (card) newExtraDeck.push({ ...card, instanceId: Date.now() + Math.random() });
          });

          const newSideDeck: Card[] = [];
          deckIds.side.forEach(id => {
            const card = cardMap.get(id);
            if (card) newSideDeck.push({ ...card, instanceId: Date.now() + Math.random() });
          });
          
          handleClearDecks();
          setMainDeck(newMainDeck);
          setExtraDeck(newExtraDeck);
          setSideDeck(newSideDeck);
        }
      } catch (error) {
        console.error("Failed to fetch cards from YDK file:", error);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };


  return (
    <>
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-5 gap-4 p-4 min-h-0">
        <div className="lg:col-span-2 flex flex-col h-full min-h-0">
          <CardSearch 
            onSearch={handleSearch} 
            results={searchResults} 
            isLoading={isLoading} 
            onDragStart={handleDragStart} 
            onCardClick={addCardToDeck}
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
            onCardRemove={removeCardFromDeck}
            onCardAdd={addCardToDeck}
            onSort={handleSortDecks}
            onClear={handleClearDecks}
            lastInteraction={lastInteraction}
            onYdkUpload={handleYdkUpload}
            isMobile={isMobile}
          />
        </div>
      </main>
    </>
  );
}
