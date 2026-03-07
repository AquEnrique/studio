
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Player, ManualPairing, DisplayPairing, StandingsPlayer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCcw, Save, X, Ban } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ManualPairingEditorProps {
  players: Player[];
  initialPairings: DisplayPairing[];
  onSave: (pairings: ManualPairing[]) => void;
  onCancel: () => void;
  roundNumber: number;
  standings: StandingsPlayer[];
}

export function ManualPairingEditor({ players, initialPairings, onSave, onCancel, roundNumber, standings }: ManualPairingEditorProps) {
  
  const [unpairedPlayers, setUnpairedPlayers] = useState<Player[]>([]);
  const [pairings, setPairings] = useState<ManualPairing[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const standingsMap = useMemo(() => new Map(standings.map(p => [p.playerId, p])), [standings]);
  const rankMap = useMemo(() => new Map(standings.map((p, index) => [p.playerId, index + 1])), [standings]);
  const pastOpponentIds = useMemo(() => {
    if (!selectedPlayer) return new Set<string>();
    const playerStanding = standingsMap.get(selectedPlayer.id);
    return new Set(playerStanding?.opponentIds || []);
  }, [selectedPlayer, standingsMap]);

  useEffect(() => {
    const pairedPlayerIds = new Set(initialPairings.flatMap(p => {
        const ids = [p.player1.id];
        if (p.player2.id !== 'bye') ids.push(p.player2.id);
        return ids;
    }));
    
    const unpairedRankedPlayers = standings
        .filter(p => !pairedPlayerIds.has(p.playerId))
        .map(p => ({ id: p.playerId, name: p.playerName }));

    setUnpairedPlayers(unpairedRankedPlayers);

    setPairings(initialPairings.map(p => ({
        player1: p.player1,
        player2: p.player2,
    })));
    setSelectedPlayer(null);
  }, [initialPairings, standings]);


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
    
    let playersToAddBack = [pairingToRemove.player1];
    if (pairingToRemove.player2.id !== 'bye') {
        playersToAddBack.push(pairingToRemove.player2 as Player);
    }
    
    setPairings(newPairings);
    
    const newUnpaired = [...unpairedPlayers, ...playersToAddBack];
    const rankedPlayerIds = standings.map(p => p.playerId);
    newUnpaired.sort((a, b) => {
        const rankA = rankedPlayerIds.indexOf(a.id);
        const rankB = rankedPlayerIds.indexOf(b.id);
        if (rankA === -1) return 1;
        if (rankB === -1) return -1;
        return rankA - rankB;
    });

    setUnpairedPlayers(newUnpaired);
    setSelectedPlayer(null);
  };
  
  const cleanPairings = () => {
    const pairedPlayers = pairings.flatMap(p => {
      const players = [p.player1];
      if (p.player2.id !== 'bye') players.push(p.player2 as Player);
      return players;
    });
    const allPlayersInEditor = [...unpairedPlayers, ...pairedPlayers];
    const allPlayerIds = allPlayersInEditor.map(p => p.id);
    
    const allUnpairedRanked = standings
      .filter(p => allPlayerIds.includes(p.playerId))
      .map(p => ({id: p.playerId, name: p.playerName}));
      
    setUnpairedPlayers(allUnpairedRanked);
    setPairings([]);
    setSelectedPlayer(null);
  };

  const isSaveReady = unpairedPlayers.length === 0 && players.length > 1;

  return (
    <div className="py-4 space-y-4 border rounded-lg p-4 bg-background/50">
       <Alert>
          <AlertTitle>Editor de Emparejamiento Manual (Ronda {roundNumber})</AlertTitle>
          <AlertDescription>
            Haz clic en los jugadores para ajustar los emparejamientos de esta ronda. Los cambios se guardarán solo para la ronda actual.
          </AlertDescription>
        </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Jugadores no emparejados ({unpairedPlayers.length})</h4>
            {players.length % 2 !== 0 && !pairings.some(p => p.player2.id === 'bye') && (
              <Button 
                  size="sm" 
                  variant="secondary" 
                  disabled={!selectedPlayer || pairings.some(p => p.player2.id === 'bye')}
                  onClick={handleAssignBye}
              >
                  <Ban className="mr-2 h-4 w-4"/> Asignar Bye
              </Button>
            )}
          </div>
          <div className="p-2 bg-muted/50 rounded-md min-h-[100px] space-y-2">
            {unpairedPlayers.map(player => {
              const rank = rankMap.get(player.id);
              return (
                <div
                  key={player.id}
                  onClick={() => handlePlayerClick(player)}
                  className={cn(
                      "p-2 bg-background rounded-md shadow-sm cursor-pointer transition-all flex justify-between items-center",
                      selectedPlayer?.id === player.id && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                      selectedPlayer && selectedPlayer.id !== player.id && pastOpponentIds.has(player.id) && "bg-muted/70 opacity-70"
                  )}
                >
                  <span>{rank ? `${rank} - ` : ''}{player.name}</span>
                </div>
              )
            })}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Emparejamientos ({pairings.length})</h4>
          <div className="p-2 bg-muted/50 rounded-md min-h-[100px] space-y-2">
            {pairings.map((pairing, index) => (
              <Card key={index} className="bg-background">
                <CardContent className="p-2 flex items-center justify-between">
                  <div className="font-medium space-y-1">
                    <div className="flex items-center justify-between">
                        <span>{pairing.player1.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>{pairing.player2.name}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removePairing(index)}>
                    Eliminar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="ghost" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" /> Cancelar
        </Button>
        <Button variant="outline" onClick={cleanPairings} disabled={pairings.length === 0}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Limpiar
        </Button>
        <Button onClick={() => onSave(pairings)} disabled={!isSaveReady}>
           <Save className="mr-2 h-4 w-4" /> Guardar Emparejamientos
        </Button>
      </div>
    </div>
  );
}
