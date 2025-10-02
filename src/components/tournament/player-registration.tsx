
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Player } from '@/lib/types';
import { UserPlus } from 'lucide-react';

interface PlayerRegistrationProps {
  addPlayer: (name: string) => void;
  players: Player[];
}

export function PlayerRegistration({ addPlayer, players }: PlayerRegistrationProps) {
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
            <ul className="list-disc list-inside bg-muted/50 p-4 rounded-md">
              {players.map((player) => (
                <li key={player.id}>{player.name}</li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">No players registered yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
