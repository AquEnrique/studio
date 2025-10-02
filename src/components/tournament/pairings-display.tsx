
'use client';

import { useState } from 'react';
import type { Pairing } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PairingsDisplayProps {
  pairings: Pairing[];
  updateMatchResult: (pairing: Pairing, p1Games: number, p2Games: number) => void;
}

export function PairingsDisplay({ pairings, updateMatchResult }: PairingsDisplayProps) {
  const [results, setResults] = useState<{ [key: string]: { p1: string; p2: string } }>({});

  const handleResultChange = (pairingId: string, player: 'p1' | 'p2', value: string) => {
    setResults(prev => ({
      ...prev,
      [pairingId]: {
        ...prev[pairingId],
        [player]: value,
      }
    }));
  };

  const handleSubmit = (pairing: Pairing) => {
    const pairingId = pairing.player1.id;
    const p1Games = parseInt(results[pairingId]?.p1 || '0', 10);
    const p2Games = parseInt(results[pairingId]?.p2 || '0', 10);
    if (!isNaN(p1Games) && !isNaN(p2Games)) {
        updateMatchResult(pairing, p1Games, p2Games);
    }
  };

  return (
    <div className="space-y-2">
      {pairings.map((pairing) => {
        const pairingId = pairing.player1.id;
        return (
            <Card key={pairingId}>
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex flex-col gap-2 font-semibold">
                    <span>{pairing.player1.name}</span>
                    <span className="text-sm text-muted-foreground self-center">vs</span>
                    <span>{pairing.player2.name}</span>
                </div>

                {pairing.player2.id !== 'bye' ? (
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        className="w-16"
                        placeholder="P1"
                        aria-label={`${pairing.player1.name} score`}
                        value={results[pairingId]?.p1 || ''}
                        onChange={(e) => handleResultChange(pairingId, 'p1', e.target.value)}
                    />
                    <span>-</span>
                    <Input
                        type="number"
                        className="w-16"
                        placeholder="P2"
                        aria-label={`${pairing.player2.name} score`}
                        value={results[pairingId]?.p2 || ''}
                        onChange={(e) => handleResultChange(pairingId, 'p2', e.target.value)}
                    />
                    <Button size="sm" onClick={() => handleSubmit(pairing)}>Submit</Button>
                </div>
                ) : (
                <span className="text-sm font-bold text-primary pr-4">BYE (Win)</span>
                )}
            </CardContent>
            </Card>
        )
      })}
    </div>
  );
}
