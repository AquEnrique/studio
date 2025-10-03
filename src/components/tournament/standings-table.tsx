
'use client';

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import type { StandingsPlayer, Match } from '@/lib/types';
import { cn } from '@/lib/utils';


interface StandingsTableProps {
  players: StandingsPlayer[];
  view: 'simple' | 'advanced';
  maxRounds: number;
}

export function StandingsTable({ players, view, maxRounds }: StandingsTableProps) {
  
  const getRoundPoints = (player: StandingsPlayer, round: number): { points: number; isBye: boolean } | null => {
      const match = player.matches.find(m => m.round === round);
      if (!match) return null;
      if (match.opponentId === 'bye') return { points: 3, isBye: true };
      
      let points = 0;
      if (match.result === 'win') points = 3;
      
      return { points, isBye: false };
  };

  if (view === 'simple') {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Rank</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Points</TableHead>
            {Array.from({ length: maxRounds }, (_, i) => i + 1).map(roundNum => (
              <TableHead key={`round-head-${roundNum}`} className="text-center">R{roundNum}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player, index) => (
            <TableRow key={player.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">{player.name}</TableCell>
              <TableCell className="font-bold">{player.points}</TableCell>
              {Array.from({ length: maxRounds }, (_, i) => i + 1).map(roundNum => {
                const roundResult = getRoundPoints(player, roundNum);
                const cellContent = roundResult !== null ? roundResult.points : '-';
                const cellColor = roundResult !== null 
                  ? roundResult.isBye 
                    ? 'text-yellow-400' 
                    : roundResult.points === 3 
                      ? 'text-green-500' 
                      : 'text-red-500' 
                  : 'text-muted-foreground';

                return (
                  <TableCell key={`points-${player.id}-${roundNum}`} className={cn("text-center font-mono", cellColor)}>
                    {cellContent}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  // Advanced View
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">Rank</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Points</TableHead>
          <TableHead>OMW%</TableHead>
          <TableHead>GW%</TableHead>
          <TableHead>OGW%</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.map((player, index) => (
          <TableRow key={player.id}>
            <TableCell>{index + 1}</TableCell>
            <TableCell className="font-medium">{player.name}</TableCell>
            <TableCell>{player.points}</TableCell>
            <TableCell>{player.omwPercentage.toFixed(3)}</TableCell>
            <TableCell>{player.gwPercentage.toFixed(3)}</TableCell>
            <TableCell>{player.ogwPercentage.toFixed(3)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
