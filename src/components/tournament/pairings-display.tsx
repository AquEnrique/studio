
'use client';

import { useState } from 'react';
import type { Pairing } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PairingsDisplayProps {
  pairings: Pairing[];
  updateMatchResult: (playerId: string, result: 'win' | 'loss' | 'draw') => void;
}

export function PairingsDisplay({ pairings, updateMatchResult }: PairingsDisplayProps) {

  const handleResultChange = (pairing: Pairing, player1Result: 'win' | 'loss' | 'draw' | 'pending') => {
      if (player1Result === 'pending') return;
      
      let player2Result: 'win' | 'loss' | 'draw' = 'draw';
      if (player1Result === 'win') player2Result = 'loss';
      if (player1Result === 'loss') player2Result = 'win';
      
      updateMatchResult(pairing.player1.id, player1Result);
      if (pairing.player2.id !== 'bye') {
        updateMatchResult(pairing.player2.id, player2Result);
      }
  }


  return (
    <div className="space-y-2">
      {pairings.map((pairing, index) => (
        <Card key={index}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <span className="font-semibold">{pairing.player1.name}</span>
              <span className="text-sm text-muted-foreground">vs</span>
              <span className="font-semibold">{pairing.player2.name}</span>
            </div>
            {pairing.player2.id !== 'bye' ? (
                <Select onValueChange={(value) => handleResultChange(pairing, value as any)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Report Result" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="win">{pairing.player1.name} Wins</SelectItem>
                        <SelectItem value="loss">{pairing.player2.name} Wins</SelectItem>
                        <SelectItem value="draw">Draw</SelectItem>
                    </SelectContent>
                </Select>
            ) : (
                <span className="text-sm font-bold text-primary pr-4">BYE</span>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
