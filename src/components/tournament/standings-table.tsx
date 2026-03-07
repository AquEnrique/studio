
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
  view: 'simple' | 'advanced' | 'judge';
  maxRounds: number;
}

export function StandingsTable({ players, view, maxRounds }: StandingsTableProps) {
  
  const [calculationInfo, setCalculationInfo] = useState<CalculationInfo>(null);

  const showColumnInfo = (column: 'OTP' | 'GWP') => {
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
      case 'GWP':
        info = {
          title: 'Game Win % (GW%)',
          description: (
            <>
              <p>Este es el segundo desempate. Es el porcentaje de juegos individuales ganados a lo largo del torneo.</p>
              <br />
              <p><strong>Fórmula:</strong> (Juegos Ganados) / (Juegos Jugados)</p>
              <p className="text-xs text-muted-foreground mt-2">Las rondas con bye no se incluyen en este cálculo.</p>
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
                let cellContent: React.ReactNode = '-';
                let cellColor = 'text-muted-foreground';

                if (roundResult) {
                    if (roundResult.isBye) {
                        cellContent = 'BYE';
                        cellColor = 'text-yellow-400';
                    } else {
                        const points = roundResult.wins === 2 ? 3 : 0;
                        cellContent = points;
                        if (points === 3) {
                            cellColor = 'text-green-500';
                        } else if (roundResult.losses === 2) {
                            cellColor = 'text-red-500';
                        }
                    }
                }
                
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

  if (view === 'judge') {
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
          <TableRow className="hover:bg-transparent">
            <TableHead className="sticky left-0 z-20 bg-card w-[60px]">Rank</TableHead>
            <TableHead className="sticky left-[60px] z-20 bg-card min-w-[200px]">Nombre</TableHead>
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
                    GW%
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => showColumnInfo('GWP')}>
                        <Info className="w-3 h-3" />
                    </Button>
                </div>
            </TableHead>
            {Array.from({ length: maxRounds }, (_, i) => i + 1).map(roundNum => (
              <TableHead key={`round-head-${roundNum}`} className="text-center min-w-[120px]">R{roundNum}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player, index) => (
            <TableRow key={player.playerId}>
              <TableCell className="sticky left-0 z-10 bg-card font-medium">{index + 1}</TableCell>
              <TableCell className="sticky left-[60px] z-10 bg-card font-medium">{player.playerName}</TableCell>
              <TableCell>{player.playerPoints}</TableCell>
              <TableCell>{player.opponentTotalPoints}</TableCell>
              <TableCell>{(player.gameWinPercentage * 100).toFixed(1)}%</TableCell>
              {player.roundResults.slice(0, maxRounds).map((result, roundIndex) => (
                <TableCell key={`round-cell-${player.playerId}-${roundIndex}`} className="text-center">
                  {result ? (
                    <div>
                      <span className={cn(
                        result.wins > result.losses ? 'text-green-500' : 
                        result.losses > result.wins ? 'text-red-500' : ''
                      )}>
                          {result.isBye ? 'BYE' : `${result.wins}/${result.losses}`}
                      </span>
                      <span className="text-xs text-muted-foreground block truncate">
                        {!result.isBye && `vs ${result.opponentName}`}
                      </span>
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
              ))}
               {/* Fill remaining cells if player has fewer rounds than maxRounds */}
              {Array.from({ length: Math.max(0, maxRounds - player.roundResults.length) }).map((_, i) => (
                  <TableCell key={`empty-cell-${player.playerId}-${i}`} className="text-center">-</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </>
    );
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
                    GW%
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => showColumnInfo('GWP')}>
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
                  {(player.gameWinPercentage * 100).toFixed(1)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
