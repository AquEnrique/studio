
'use client';

import { useState, useEffect } from 'react';
import type { Pairing, Player } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PairingsDisplayProps {
  pairings: Pairing[];
  updateMatchResult: (round: number, p1Id: string, p2Id: string, p1Games: number, p2Games: number) => void;
  roundNumber: number;
  isEditable: boolean;
}

export function PairingsDisplay({ pairings, updateMatchResult, roundNumber, isEditable }: PairingsDisplayProps) {
  const [results, setResults] = useState<{ [key: string]: { p1: string; p2: string } }>({});

   useEffect(() => {
    const initialResults: { [key: string]: { p1: string; p2: string } } = {};
    pairings.forEach(p => {
        const player1 = p.player1 as Player;
        const match = player1.matches.find(m => m.round === roundNumber);
        if (match && match.opponentId !== 'bye') {
            initialResults[player1.id] = {
                p1: match.gamesWon.toString(),
                p2: match.gamesLost.toString(),
            };
        }
    });
    setResults(initialResults);
  }, [pairings, roundNumber]);


  const handleResultChange = (pairingId: string, player: 'p1' | 'p2', value: string) => {
    setResults(prev => ({
      ...prev,
      [pairingId]: {
        ...prev[pairingId],
        [player]: value,
      }
    }));
  };

  const handleSubmitAll = () => {
    pairings.forEach(pairing => {
      const p1Id = pairing.player1.id;
      const result = results[p1Id];
      if (result && result.p1 !== undefined && result.p2 !== undefined) {
        const p2Id = (pairing.player2 as Player).id;
        const p1Games = parseInt(result.p1, 10);
        const p2Games = parseInt(result.p2, 10);

        const player1 = pairing.player1 as Player;
        const match = player1.matches.find(m => m.round === roundNumber && m.opponentId === p2Id);

        if (!match && !isNaN(p1Games) && !isNaN(p2Games)) {
          updateMatchResult(roundNumber, p1Id, p2Id, p1Games, p2Games);
        }
      }
    });
  };

  const allMatchesInRoundSubmitted = pairings.every(pairing => {
    if (pairing.player2.id === 'bye') return true;
    const player1 = pairing.player1 as Player;
    return player1.matches.some(m => m.round === roundNumber && m.opponentId === (pairing.player2 as Player).id);
  });

  return (
    <div className="space-y-2">
      {pairings.map((pairing) => {
        const pairingId = pairing.player1.id;
        const player2IsBye = pairing.player2.id === 'bye';
        const match = (pairing.player1 as Player).matches.find(m => m.round === roundNumber);
        const isSubmitted = !!match && match.opponentId !== 'bye' && match.round === roundNumber;

        return (
            <Card key={pairingId}>
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex flex-col gap-2 font-semibold">
                    <span>{pairing.player1.name}</span>
                    <span className="text-sm text-muted-foreground self-center">vs</span>
                    <span>{pairing.player2.name}</span>
                </div>

                {!player2IsBye ? (
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        className="w-16"
                        placeholder="P1"
                        aria-label={`${pairing.player1.name} score`}
                        value={results[pairingId]?.p1 ?? ''}
                        onChange={(e) => handleResultChange(pairingId, 'p1', e.target.value)}
                        disabled={!isEditable || isSubmitted}
                    />
                    <span>-</span>
                    <Input
                        type="number"
                        className="w-16"
                        placeholder="P2"
                        aria-label={`${pairing.player2.name} score`}
                        value={results[pairingId]?.p2 ?? ''}
                        onChange={(e) => handleResultChange(pairingId, 'p2', e.target.value)}
                        disabled={!isEditable || isSubmitted}
                    />
                </div>
                ) : (
                <span className="text-sm font-bold text-primary pr-4">BYE (Win)</span>
                )}
            </CardContent>
            </Card>
        )
      })}
       {isEditable && !allMatchesInRoundSubmitted && (
        <Button onClick={handleSubmitAll} className="w-full mt-4">
          Submit All Results
        </Button>
      )}
    </div>
  );
}
