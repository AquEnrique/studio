
'use client';

import { useState, useMemo } from 'react';
import type { Player, ManualPairing } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hand, Shuffle, Play } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface ManualPairingProps {
  players: Player[];
  onStartTournament: (pairings: ManualPairing[]) => void;
}

export function ManualPairing({ players, onStartTournament }: ManualPairingProps) {
  const [unpairedPlayers, setUnpairedPlayers] = useState<Player[]>(players);
  const [pairings, setPairings] = useState<ManualPairing[]>([]);

  // Memoize to avoid re-renders when parent state changes but players prop does not
  useMemo(() => {
    setUnpairedPlayers(players);
    setPairings([]);
  }, [players]);

  const handleDragStart = (e: React.DragEvent, player: Player) => {
    e.dataTransfer.setData('application/json', JSON.stringify(player));
  };

  const handleDropOnPlayer = (e: React.DragEvent, player2: Player) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;

    const player1 = JSON.parse(data) as Player;
    if (player1.id === player2.id) return;

    setPairings(prev => [...prev, { player1, player2 }]);
    setUnpairedPlayers(prev => prev.filter(p => p.id !== player1.id && p.id !== player2.id));
  };

  const handleDropOnBye = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    const player1 = JSON.parse(data) as Player;

    // Check if there's already a bye
    if (pairings.some(p => p.player2.id === 'bye')) {
      return; // only one bye allowed
    }

    setPairings(prev => [...prev, { player1, player2: { id: 'bye', name: 'BYE' } }]);
    setUnpairedPlayers(prev => prev.filter(p => p.id !== player1.id));
  };


  const removePairing = (index: number) => {
    const pairingToRemove = pairings[index];
    const newPairings = pairings.filter((_, i) => i !== index);
    
    let playersToAddBack = [pairingToRemove.player1];
    if (pairingToRemove.player2.id !== 'bye') {
        playersToAddBack.push(pairingToRemove.player2 as Player);
    }
    
    setPairings(newPairings);
    setUnpairedPlayers(prev => [...prev, ...playersToAddBack]);
  };
  
  const resetPairings = () => {
    setUnpairedPlayers(players);
    setPairings([]);
  };

  const isTournamentReady = unpairedPlayers.length === 0 && players.length > 1;

  return (
    <div className="py-4 space-y-4">
       <Alert>
          <Hand className="h-4 w-4" />
          <AlertTitle>Create First Round Pairings</AlertTitle>
          <AlertDescription>
            Drag and drop players to create manual pairings for the first round. If you have an odd number of players, one player can be assigned a bye.
          </AlertDescription>
        </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Unpaired Players ({unpairedPlayers.length})</h4>
          <div className="p-2 bg-muted/50 rounded-md min-h-[100px] space-y-2">
            {unpairedPlayers.map(player => (
              <div
                key={player.id}
                draggable
                onDragStart={e => handleDragStart(e, player)}
                onDrop={e => handleDropOnPlayer(e, player)}
                onDragOver={e => e.preventDefault()}
                className="p-2 bg-background rounded-md shadow-sm cursor-grab active:cursor-grabbing"
              >
                {player.name}
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Manual Pairings ({pairings.length})</h4>
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
             {players.length % 2 !== 0 && !pairings.some(p=>p.player2.id==='bye') && (
                 <div
                    onDrop={handleDropOnBye}
                    onDragOver={e => e.preventDefault()}
                    className="p-4 border-2 border-dashed border-border rounded-md text-center text-muted-foreground"
                 >
                    Drag a player here for a BYE
                 </div>
             )}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={resetPairings} disabled={pairings.length === 0}>
          <Shuffle className="mr-2 h-4 w-4" /> Reset Pairings
        </Button>
        <Button onClick={() => onStartTournament(pairings)} disabled={!isTournamentReady}>
           <Play className="mr-2 h-4 w-4" /> Start Manual Tournament
        </Button>
      </div>
    </div>
  );
}
