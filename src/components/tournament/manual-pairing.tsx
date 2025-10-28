
'use client';

import { useState, useMemo } from 'react';
import type { Player, ManualPairing } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Hand, Play, Ban, RefreshCcw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ManualPairingProps {
  players: Player[];
  onStartTournament: (pairings: ManualPairing[]) => void;
}

export function ManualPairing({ players, onStartTournament }: ManualPairingProps) {
  const [unpairedPlayers, setUnpairedPlayers] = useState<Player[]>(players);
  const [pairings, setPairings] = useState<ManualPairing[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Memoize to avoid re-renders when parent state changes but players prop does not
  useMemo(() => {
    setUnpairedPlayers(players.sort((a, b) => a.name.localeCompare(b.name)));
    setPairings([]);
    setSelectedPlayer(null);
  }, [players]);

  const handlePlayerClick = (player: Player) => {
    if (selectedPlayer) {
      if (selectedPlayer.id === player.id) {
        // Deselect player
        setSelectedPlayer(null);
      } else {
        // Create a pair
        setPairings(prev => [...prev, { player1: selectedPlayer, player2: player }]);
        setUnpairedPlayers(prev => prev.filter(p => p.id !== selectedPlayer.id && p.id !== player.id));
        setSelectedPlayer(null);
      }
    } else {
      // Select first player
      setSelectedPlayer(player);
    }
  };

  const handleAssignBye = () => {
    if (!selectedPlayer) return;

    if (pairings.some(p => p.player2.id === 'bye')) {
      return; // Only one bye allowed
    }

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
    setUnpairedPlayers(prev => [...prev, ...playersToAddBack].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedPlayer(null);
  };
  
  const cleanPairings = () => {
    setUnpairedPlayers(players.sort((a,b) => a.name.localeCompare(b.name)));
    setPairings([]);
    setSelectedPlayer(null);
  };

  const isTournamentReady = unpairedPlayers.length === 0 && players.length > 1;

  return (
    <div className="py-4 space-y-4">
       <Alert>
          <Hand className="h-4 w-4" />
          <AlertTitle>Create First Round Pairings</AlertTitle>
          <AlertDescription>
            Click a player, then click another to create a pair. To assign a bye, select a player and click 'Assign Bye'.
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
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={cleanPairings} disabled={pairings.length === 0}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Clean
        </Button>
        <Button onClick={() => onStartTournament(pairings)} disabled={!isTournamentReady}>
           <Play className="mr-2 h-4 w-4" /> Start Manual Tournament
        </Button>
      </div>
    </div>
  );
}
