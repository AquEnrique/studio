
'use client';

import { useState, useEffect } from 'react';
import type { DisplayPairing, Player, ManualPairing, StandingsPlayer } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ManualPairingEditor } from './manual-pairing-editor';
import { Pencil } from 'lucide-react';

interface PairingsDisplayProps {
  pairings: DisplayPairing[];
  submitResults: (roundIndex: number, results: { p1Id: string; p2Id: string | null; p1Games: number; p2Games: number }[]) => void;
  roundNumber: number;
  isEditable: boolean;
  allPlayers: Player[];
  onUpdatePairings: (newPairings: ManualPairing[]) => void;
  isViewingHistory: boolean;
  standings: StandingsPlayer[];
}

export function PairingsDisplay({ pairings, submitResults, roundNumber, isEditable, allPlayers, onUpdatePairings, isViewingHistory, standings }: PairingsDisplayProps) {
  const [results, setResults] = useState<{ [key: string]: { p1: string; p2: string } }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingSubmitted, setIsEditingSubmitted] = useState(false);

  useEffect(() => {
    const initialResults: { [key: string]: { p1: string; p2: string } } = {};
    pairings.forEach(p => {
        if(p.result) {
            initialResults[p.player1.id] = {
                p1: p.result.p1Games,
                p2: p.result.p2Games,
            };
        }
    });
    setResults(initialResults);
    // When pairings change (e.g. next round), exit editing mode
    setIsEditing(false);
    setIsEditingSubmitted(false);
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
    const resultsToSubmit: { p1Id: string; p2Id: string | null; p1Games: number; p2Games: number }[] = [];
    pairings.forEach(pairing => {
      const p1Id = pairing.player1.id;
      const result = results[p1Id];
      if (result && (result.p1 !== undefined || result.p2 !== undefined)) {
        if(pairing.player2.id === 'bye') return;
        const p2Id = (pairing.player2 as Player).id;
        const p1Games = parseInt(result.p1 || '0', 10);
        const p2Games = parseInt(result.p2 || '0', 10);
        
        if (!isNaN(p1Games) && !isNaN(p2Games)) {
            resultsToSubmit.push({p1Id, p2Id, p1Games, p2Games})
        }
      }
    });

    if (resultsToSubmit.length > 0) {
      submitResults(roundNumber - 1, resultsToSubmit);
    }
    setIsEditingSubmitted(false);
  };

  const handleSavePairings = (newPairings: ManualPairing[]) => {
    onUpdatePairings(newPairings);
    setIsEditing(false);
  }

  const anyMatchSubmittedInRound = !isViewingHistory && pairings.some(p => p.isSubmitted && p.player2.id !== 'bye');

  if (isEditing) {
    return (
        <ManualPairingEditor
            players={allPlayers}
            initialPairings={pairings}
            onSave={handleSavePairings}
            onCancel={() => setIsEditing(false)}
            roundNumber={roundNumber}
            standings={standings}
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
        
        const isMatchLocked = !isViewingHistory && pairing.isSubmitted && !isEditingSubmitted;

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
                    disabled={!isEditable || isMatchLocked}
                  />
                  <span>-</span>
                  <Input
                    type="number"
                    min="0"
                    max="2"
                    className="w-16"
                    placeholder="P2"
                    aria-label={`${(pairing.player2 as Player).name} score`}
                    value={results[pairingId]?.p2 ?? ''}
                    onChange={(e) => handleResultChange(pairingId, 'p2', e.target.value)}
                    disabled={!isEditable || isMatchLocked}
                  />
                </div>
              ) : (
                <span className="text-sm font-bold text-primary pr-4">BYE (Win)</span>
              )}
            </CardContent>
          </Card>
        )
      })}
      {isEditable && (
        <div className="w-full mt-4">
          {anyMatchSubmittedInRound && !isEditingSubmitted && !isViewingHistory ? (
            <Button variant="outline" onClick={() => setIsEditingSubmitted(true)} className="w-full">
              Edit Results
            </Button>
          ) : (
            <Button onClick={handleSubmitAll} className="w-full">
              {anyMatchSubmittedInRound ? 'Update All Results' : 'Submit All Results'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
