
'use client';

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import type { StandingsPlayer } from '@/lib/types';

interface StandingsTableProps {
  players: StandingsPlayer[];
}

export function StandingsTable({ players }: StandingsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rank</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Points</TableHead>
          <TableHead>OMW%</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.map((player, index) => (
          <TableRow key={player.id}>
            <TableCell>{index + 1}</TableCell>
            <TableCell>{player.name}</TableCell>
            <TableCell>{player.points}</TableCell>
            <TableCell>{player.omwPercentage.toFixed(4)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
