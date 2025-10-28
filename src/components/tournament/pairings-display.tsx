
'use client';

import { useState, useEffect } from 'react';
import type { Pairing, Player, ManualPairing } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ManualPairingEditor } from './manual-pairing-editor';
import { Pencil } from 'lucide-react';

interface PairingsDisplayProps {
  pairings: Pairing[];
  updateMatchResult: (round: number, p1Id: string, p2Id: string, p1Games: number, p2Games: number) => void;
  roundNumber: number;
  isEditable: boolean;
  allPlayers: Player[];
  onUpdatePairings: (newPairings: ManualPairing[]) => void;
}

export function PairingsDisplay({ pairings, updateMatchResult, roundNumber, isEditable, allPlayers, onUpdatePairings }: PairingsDisplayProps) {
  const [results, setResults] = useState<{ [key: string]: { p1: string; p2: string } }>({});
  const [isEditing, setIsEditing] = useState(false);

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
    // When pairings change (e.g. next round), exit editing mode
    setIsEditing(false);
  }, [pairings, roundNumber]);

  const handleResultChange = (pairingId: string, player: 'p1' | 'p2', value: string) => {
    if (value === '') {
      setResults(prev => ({ ...prev, [pairingId]: { ...prev[pairingId], [player]: '' } }));
      return;
    }

    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 2) {
      setResults(prev => ({
        ...prev,
        [pairingId]: {
          ...prev[pairingId],
          [player]: value,
        }
      }));
    }
  };

  const handleSubmitAll = () => {
    pairings.forEach(pairing => {
      const p1Id = pairing.player1.id;
      const result = results[p1Id];
      if (result && (result.p1 !== undefined || result.p2 !== undefined)) {
        const p2Id = (pairing.player2 as Player).id;
        const p1Games = parseInt(result.p1 || '0', 10);
        const p2Games = parseInt(result.p2 || '0', 10);

        const player1 = pairing.player1 as Player;
        const match = player1.matches.find(m => m.round === roundNumber && m.opponentId === p2Id);

        if (!match && !isNaN(p1Games) && !isNaN(p2Games)) {
          updateMatchResult(roundNumber, p1Id, p2Id, p1Games, p2Games);
        }
      }
    });
  };

  const handleSavePairings = (newPairings: ManualPairing[]) => {
    onUpdatePairings(newPairings);
    setIsEditing(false);
  }

  const anyMatchSubmittedInRound = pairings.some(pairing => {
    if (pairing.player2.id === 'bye') return false; // Byes don't count as submitted results
    const player1 = pairing.player1 as Player;
    return player1.matches.some(m => m.round === roundNumber && m.opponentId === (pairing.player2 as Player).id);
  });

  if (isEditing) {
    return (
        <ManualPairingEditor
            players={allPlayers}
            initialPairings={pairings}
            onSave={handleSavePairings}
            onCancel={() => setIsEditing(false)}
            roundNumber={roundNumber}
        />
    )
  }

  return (
    <div className="space-y-2 mb-16 xl:mb-0">
      {isEditable && !anyMatchSubmittedInRound && (
        <div className="flex justify-end mb-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Pairings
            </Button>
        </div>
      )}
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
                    min="0"
                    max="2"
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
                    min="0"
                    max="2"
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
      {isEditable && !anyMatchSubmittedInRound && (
        <Button onClick={handleSubmitAll} className="w-full mt-4">
          Submit All Results
        </Button>
      )}
    </div>
  );
}
