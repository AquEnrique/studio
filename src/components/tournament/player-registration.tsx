
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Player, ManualPairing } from '@/lib/types';
import { UserPlus, X } from 'lucide-react';
import { ManualPairing as ManualPairingComponent } from './manual-pairing';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface PlayerRegistrationProps {
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  players: Player[];
  startManualTournament: (pairings: ManualPairing[]) => void;
}

export function PlayerRegistration({ addPlayer, removePlayer, players, startManualTournament }: PlayerRegistrationProps) {
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
        <CardDescription>Add players to the tournament. Once registration is complete, you can start the tournament with random pairings or set them up manually.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="registration">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="registration">Registration</TabsTrigger>
            <TabsTrigger value="manual-pairing">Manual Pairing</TabsTrigger>
          </TabsList>
          <TabsContent value="registration">
              <div className="flex gap-2 my-4">
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
          </TabsContent>
          <TabsContent value="manual-pairing">
            <ManualPairingComponent players={players} onStartTournament={startManualTournament} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
