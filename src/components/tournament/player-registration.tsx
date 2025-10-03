
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Player } from '@/lib/types';
import { UserPlus, X } from 'lucide-react';

interface PlayerRegistrationProps {
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  players: Player[];
}

export function PlayerRegistration({ addPlayer, removePlayer, players }: PlayerRegistrationProps) {
  const [newPlayerName, setNewPlayerName] = useState('');

  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      addPlayer(newPlayerName.trim());
      setNewPlayerName('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Registration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter player name"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
          />
          <Button onClick={handleAddPlayer}>
            <UserPlus className="mr-2 h-4 w-4" /> Add Player
          </Button>
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">Registered Players ({players.length})</h3>
          {players.length > 0 ? (
            <div className="bg-muted/50 p-4 rounded-md max-h-60 overflow-y-auto">
              <ul className="space-y-2">
                {players.map((player, index) => (
                  <li key={player.id} className="flex justify-between items-center group bg-background/50 p-2 rounded-md">
                    <div>
                      <span className="text-sm font-mono mr-2 text-muted-foreground">{index + 1}.</span>
                      <span>{player.name}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => removePlayer(player.id)}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No players registered yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
