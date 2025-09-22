'use client';

import { useState } from 'react';
import type { Card } from '@/lib/types';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Card as CardComponent, CardContent } from './ui/card';
import { CardDisplay } from './card-display';
import { Skeleton } from './ui/skeleton';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

interface CardSearchProps {
  onSearch: (term: string) => void;
  results: Card[];
  isLoading: boolean;
  onDragStart: (e: React.DragEvent, card: Card, source: 'search') => void;
  onCardClick: (card: Card) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export function CardSearch({ onSearch, results, isLoading, onDragStart, onCardClick, isCollapsed, setIsCollapsed }: CardSearchProps) {
  const [term, setTerm] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(term);
  };
  
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <CardComponent className="flex flex-col flex-grow h-full overflow-hidden shadow-lg">
      <CardContent className="p-4 flex-grow flex flex-col">
        <form onSubmit={handleFormSubmit} className="flex gap-2 mb-4">
          <Input
            placeholder="Search for a card..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="text-base"
          />
          <Button type="submit" disabled={isLoading} size="icon" aria-label="Search">
            <Search />
          </Button>
           <Button 
            type="button" 
            onClick={toggleCollapse} 
            size="icon" 
            variant="outline" 
            className="lg:hidden"
            aria-label={isCollapsed ? "Expand search results" : "Collapse search results"}
          >
            {isCollapsed ? <ChevronDown /> : <ChevronUp />}
          </Button>
        </form>
        <div className={`flex-grow transition-all duration-300 ease-in-out ${isCollapsed ? 'hidden' : 'block'}`}>
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-4">
              {isLoading && (
                <>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </>
              )}
              {!isLoading && results.length === 0 && (
                <div className="text-center text-muted-foreground pt-10">
                  <p>Begin by searching for a card.</p>
                </div>
              )}
              {!isLoading && results.map((card) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, card, 'search')}
                  onClick={() => onCardClick(card)}
                  className="cursor-pointer active:cursor-grabbing transition-all duration-200 hover:scale-[1.02] hover:shadow-cyan-500/20"
                >
                  <CardDisplay card={card} />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </CardComponent>
  );
}
