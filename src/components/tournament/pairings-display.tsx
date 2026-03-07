
'use client';

import { useState, useEffect } from 'react';
import type { DisplayPairing, Player, ManualPairing, StandingsPlayer, Tournament } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ManualPairingEditor } from './manual-pairing-editor';
import { Pencil } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PairingsDisplayProps {
  pairings: DisplayPairing[];
  submitResults: (roundIndex: number, results: { p1Id: string; p2Id: string | null; p1Games: number; p2Games: number }[]) => void;
  roundNumber: number;
  isEditable: boolean;
  allPlayers: Player[];
  onUpdatePairings: (newPairings: ManualPairing[]) => void;
  isViewingHistory: boolean;
  standings: StandingsPlayer[];
  onRollbackRound: (roundIndex: number) => void;
  tournament: Tournament;
}

const ScoreSelector = ({
  score,
  onScoreChange,
  disabled,
  otherPlayerScore,
}: {
  score: string;
  onScoreChange: (score: string) => void;
  disabled: boolean;
  otherPlayerScore: string;
}) => {
  return (
    <div className="flex justify-center gap-1">
      {[0, 1, 2].map(val => (
        <Button
          key={val}
          variant={score === String(val) ? 'secondary' : 'outline'}
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={(e) => { e.preventDefault(); onScoreChange(String(val)); }}
          disabled={disabled || (val === 2 && otherPlayerScore === '2')}
        >
          {val}
        </Button>
      ))}
    </div>
  );
};


export function PairingsDisplay({ pairings, submitResults, roundNumber, isEditable, allPlayers, onUpdatePairings, isViewingHistory, standings, onRollbackRound, tournament }: PairingsDisplayProps) {
  const [results, setResults] = useState<{ [key: string]: { p1: string; p2: string } }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isHistoryAlertOpen, setIsHistoryAlertOpen] = useState(false);

  useEffect(() => {
    setIsEditing(false);
  }, [roundNumber]);

  useEffect(() => {
    const initialResults: { [key: string]: { p1: string; p2: string } } = {};
    pairings.forEach(p => {
      if (p.player2.id !== 'bye') {
        initialResults[p.player1.id] = {
            p1: p.result?.p1Games ?? '0',
            p2: p.result?.p2Games ?? '0',
        };
      }
    });
    setResults(initialResults);
  }, [pairings]);

  const handleResultChange = (pairingId: string, player: 'p1' | 'p2', value: string) => {
    setResults(prev => ({
        ...prev,
        [pairingId]: {
            ...(prev[pairingId]),
            [player]: value,
        }
    }));
  };
  
  const performSubmit = () => {
    const resultsToSubmit: { p1Id: string; p2Id: string | null; p1Games: number; p2Games: number }[] = [];
    pairings.forEach(pairing => {
      const p1Id = pairing.player1.id;
      const result = results[p1Id];
      
      if(pairing.player2.id === 'bye') return;

      const p2Id = (pairing.player2 as Player).id;
      const p1Games = result ? parseInt(result.p1, 10) : 0;
      const p2Games = result ? parseInt(result.p2, 10) : 0;
      
      if (!isNaN(p1Games) && !isNaN(p2Games)) {
          if (p1Games === 2 && p2Games === 2) {
            console.error(`Invalid score 2-2 for match: ${pairing.player1.name} vs ${pairing.player2.name}`);
            return;
          }
          resultsToSubmit.push({p1Id, p2Id, p1Games, p2Games})
      }
    });

    if (resultsToSubmit.length > 0 || pairings.some(p => p.player2.id === 'bye')) {
      submitResults(roundNumber - 1, resultsToSubmit);
    }
    setIsHistoryAlertOpen(false);
  };


  const handleSubmitAll = () => {
    if (isViewingHistory) {
      setIsHistoryAlertOpen(true);
    } else {
      performSubmit();
    }
  };

  const handleSavePairings = (newPairings: ManualPairing[]) => {
    onUpdatePairings(newPairings);
    setIsEditing(false);
  }

  const handleEditClick = () => {
    onRollbackRound(roundNumber - 1);
  };

  const isRoundSubmitted = pairings.every(p => p.isSubmitted) && pairings.length > 0;

  if (isEditing) {
    return (
        <ManualPairingEditor
            players={allPlayers}
            initialPairings={pairings}
            onSave={handleSavePairings}
            onCancel={() => setIsEditing(false)}
            roundNumber={roundNumber}
            standings={standings}
            tournament={tournament}
        />
    )
  }

  return (
    <>
       <AlertDialog open={isHistoryAlertOpen} onOpenChange={setIsHistoryAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar edición histórica?</AlertDialogTitle>
            <AlertDialogDescription>
                Estás a punto de modificar la ronda {roundNumber}. Esto eliminará todas las rondas futuras y no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={performSubmit}>Confirmar y Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-2 mb-16 xl:mb-0">
        {isEditable && (
          <div className="flex justify-end mb-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} disabled={isRoundSubmitted}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar Emparejamientos
              </Button>
          </div>
        )}
        {pairings.map((pairing) => {
          const pairingId = pairing.player1.id;
          const player2IsBye = pairing.player2.id === 'bye';
          const isMatchLocked = pairing.isSubmitted;

          const p1Score = results[pairingId]?.p1 ?? '0';
          const p2Score = results[pairingId]?.p2 ?? '0';

          return (
            <Card key={pairingId}>
              <CardContent className="p-4">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-2">
                  <div className="font-semibold truncate text-left">{pairing.player1.name}</div>
                  <div className="text-muted-foreground">vs</div>
                  <div className="font-semibold truncate text-right">{pairing.player2.name}</div>
                </div>
                
                {!player2IsBye ? (
                  <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 sm:gap-x-4">
                    <ScoreSelector 
                      score={p1Score}
                      onScoreChange={(score) => handleResultChange(pairingId, 'p1', score)}
                      disabled={!isEditable || isMatchLocked}
                      otherPlayerScore={p2Score}
                    />
                    <span className="text-muted-foreground text-center">-</span>
                    <ScoreSelector 
                      score={p2Score}
                      onScoreChange={(score) => handleResultChange(pairingId, 'p2', score)}
                      disabled={!isEditable || isMatchLocked}
                      otherPlayerScore={p1Score}
                    />
                  </div>
                ) : (
                  <div className="mt-4 text-center text-sm font-bold text-primary">BYE (Win)</div>
                )}
              </CardContent>
            </Card>
          )
        })}
        {isEditable && (
          <div className="w-full mt-4">
            {isRoundSubmitted ? (
              <Button variant="outline" onClick={handleEditClick} className="w-full">
                Editar Resultados
              </Button>
            ) : (
              <Button onClick={handleSubmitAll} className="w-full">
                {isViewingHistory ? 'Confirmar Cambios' : 'Enviar Todos los Resultados'}
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
