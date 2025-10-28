
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Player, ManualPairing, Pairing } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Shuffle, Save, X, Ban } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ManualPairingEditorProps {
  players: Player[];
  initialPairings: Pairing[];
  onSave: (pairings: ManualPairing[]) => void;
  onCancel: () => void;
  roundNumber: number;
}

export function ManualPairingEditor({ players, initialPairings, onSave, onCancel, roundNumber }: ManualPairingEditorProps) {
  
  const [unpairedPlayers, setUnpairedPlayers] = useState<Player[]>([]);
  const [pairings, setPairings] = useState<ManualPairing[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  useEffect(() => {
    const pairedPlayerIds = new Set(initialPairings.flatMap(p => [p.player1.id, (p.player2 as Player)?.id]).filter(Boolean));
    setUnpairedPlayers(players.filter(p => !pairedPlayerIds.has(p.id)).sort((a,b) => a.name.localeCompare(b.name)));
    setPairings(initialPairings.map(p => ({
        player1: p.player1 as Player,
        player2: p.player2 as Player | { id: 'bye', name: 'BYE' },
    })));
    setSelectedPlayer(null);
  }, [players, initialPairings]);


  const handlePlayerClick = (player: Player) => {
    if (selectedPlayer) {
      if (selectedPlayer.id === player.id) {
        setSelectedPlayer(null);
      } else {
        setPairings(prev => [...prev, { player1: selectedPlayer, player2: player }]);
        setUnpairedPlayers(prev => prev.filter(p => p.id !== selectedPlayer.id && p.id !== player.id));
        setSelectedPlayer(null);
      }
    } else {
      setSelectedPlayer(player);
    }
  };

  const handleAssignBye = () => {
    if (!selectedPlayer) return;
    if (pairings.some(p => p.player2.id === 'bye')) return;

    setPairings(prev => [...prev, { player1: selectedPlayer, player2: { id: 'bye', name: 'BYE' } }]);
    setUnpairedPlayers(prev => prev.filter(p => p.id !== selectedPlayer.id));
    setSelectedPlayer(null);
  };

  const removePairing = (index: number) => {
    const pairingToRemove = pairings[index];
    const newPairings = pairings.filter((_, i) => i !== index);
    
    let playersToAddBack = [pairingToRemove.player1 as Player];
    if (pairingToRemove.player2.id !== 'bye') {
        playersToAddBack.push(pairingToRemove.player2 as Player);
    }
    
    setPairings(newPairings);
    setUnpairedPlayers(prev => [...prev, ...playersToAddBack].sort((a,b) => a.name.localeCompare(b.name)));
    setSelectedPlayer(null);
  };
  
  const resetPairings = () => {
    const pairedPlayerIds = new Set(initialPairings.flatMap(p => [p.player1.id, (p.player2 as Player)?.id]).filter(Boolean));
    setUnpairedPlayers(players.filter(p => !pairedPlayerIds.has(p.id)).sort((a,b) => a.name.localeCompare(b.name)));
    setPairings(initialPairings.map(p => ({
        player1: p.player1 as Player,
        player2: p.player2 as Player | { id: 'bye', name: 'BYE' },
    })));
    setSelectedPlayer(null);
  };

  const isSaveReady = unpairedPlayers.length === 0 && players.length > 1;

  return (
    <div className="py-4 space-y-4 border rounded-lg p-4 bg-background/50">
       <Alert>
          <AlertTitle>Manual Pairing Editor (Round {roundNumber})</AlertTitle>
          <AlertDescription>
            Click players to adjust pairings for this round. Changes will be saved for the current round only.
          </AlertDescription>
        </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Unpaired Players ({unpairedPlayers.length})</h4>
            {players.length % 2 !== 0 && !pairings.some(p => p.player2.id === 'bye') && (
              <Button 
                  size="sm" 
                  variant="secondary" 
                  disabled={!selectedPlayer || pairings.some(p => p.player2.id === 'bye')}
                  onClick={handleAssignBye}
              >
                  <Ban className="mr-2 h-4 w-4"/> Assign Bye
              </Button>
            )}
          </div>
          <div className="p-2 bg-muted/50 rounded-md min-h-[100px] space-y-2">
            {unpairedPlayers.map(player => (
              <div
                key={player.id}
                onClick={() => handlePlayerClick(player)}
                className={cn(
                    "p-2 bg-background rounded-md shadow-sm cursor-pointer transition-all",
                    selectedPlayer?.id === player.id && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
              >
                {player.name}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Pairings ({pairings.length})</h4>
          <div className="p-2 bg-muted/50 rounded-md min-h-[100px] space-y-2">
            {pairings.map((pairing, index) => (
              <Card key={index} className="bg-background">
                <CardContent className="p-2 flex items-center justify-between">
                  <div className="font-medium">
                    <span>{pairing.player1.name}</span>
                    <span className="text-muted-foreground mx-2">vs</span>
                    <span>{pairing.player2.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removePairing(index)}>
                    Remove
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="ghost" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button variant="outline" onClick={resetPairings} disabled={pairings.length === 0}>
          <Shuffle className="mr-2 h-4 w-4" /> Reset
        </Button>
        <Button onClick={() => onSave(pairings)} disabled={!isSaveReady}>
           <Save className="mr-2 h-4 w-4" /> Save Pairings
        </Button>
      </div>
    </div>
  );
}
