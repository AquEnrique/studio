
'use client';

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import type { StandingsPlayer } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type CalculationInfo = {
  title: string;
  description: React.ReactNode;
} | null;

interface StandingsTableProps {
  players: StandingsPlayer[];
  view: 'simple' | 'advanced';
  maxRounds: number;
}

export function StandingsTable({ players, view, maxRounds }: StandingsTableProps) {
  
  const [calculationInfo, setCalculationInfo] = useState<CalculationInfo>(null);

  const showColumnInfo = (column: 'OTP' | 'MWP') => {
    let info: CalculationInfo = null;
    switch (column) {
      case 'OTP':
        info = {
          title: 'Opponent Total Points (OTP)',
          description: (
            <>
              <p>Este es el primer desempate. Es la suma de los puntos de partido de todos los oponentes que has enfrentado.</p>
              <br />
              <p>Un OTP más alto indica que has jugado contra oponentes que han tenido un mejor desempeño en el torneo.</p>
            </>
          ),
        };
        break;
      case 'MWP':
        info = {
          title: 'Match Win % (MWP)',
          description: (
            <>
              <p>Este es el segundo desempate. Se calcula con una fórmula específica.</p>
              <br />
              <p><strong>Fórmula:</strong> (Victorias + Byes) / (Victorias + Derrotas + 2 * Byes)</p>
              <p className="text-xs text-muted-foreground mt-2">Los empates no se incluyen en este cálculo.</p>
            </>
          ),
        };
        break;
    }
    setCalculationInfo(info);
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
            <TableRow key={player.playerId}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">{player.playerName}</TableCell>
              <TableCell className="font-bold">{player.playerPoints}</TableCell>
              {Array.from({ length: maxRounds }, (_, i) => i).map(roundIndex => {
                const roundResult = player.roundResults[roundIndex];
                const cellContent = roundResult !== null ? (roundResult === 'bye' ? 'BYE' : roundResult) : '-';
                const cellColor = roundResult !== null 
                  ? roundResult === 'bye'
                    ? 'text-yellow-400' 
                    : roundResult === 3 
                      ? 'text-green-500' 
                      : roundResult === 0
                      ? 'text-red-500'
                      : ''
                  : 'text-muted-foreground';

                return (
                  <TableCell key={`points-${player.playerId}-${roundIndex}`} className={cn("text-center font-mono", cellColor)}>
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
    <>
      <AlertDialog open={!!calculationInfo} onOpenChange={(isOpen) => !isOpen && setCalculationInfo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{calculationInfo?.title}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="mt-2 text-sm text-foreground">
                {calculationInfo?.description}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Rank</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Puntos</TableHead>
            <TableHead>
                <div className="flex items-center gap-1">
                    Puntos de Oponente
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => showColumnInfo('OTP')}>
                        <Info className="w-3 h-3" />
                    </Button>
                </div>
            </TableHead>
            <TableHead>
                <div className="flex items-center gap-1">
                    MW%
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => showColumnInfo('MWP')}>
                        <Info className="w-3 h-3" />
                    </Button>
                </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player, index) => (
            <TableRow key={player.playerId}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">{player.playerName}</TableCell>
              <TableCell>{player.playerPoints}</TableCell>
              <TableCell>
                  {player.opponentTotalPoints}
              </TableCell>
              <TableCell>
                  {(player.matchWinPercentage * 100).toFixed(1)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
