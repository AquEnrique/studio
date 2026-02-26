
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
import type { StandingsPlayer, Player } from '@/lib/types';
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
  const playerMap = new Map(players.map(p => [p.id, p]));

  const getRoundPoints = (player: StandingsPlayer, round: number): { points: number; isBye: boolean } | null => {
      const match = player.matches.find(m => m.round === round);
      if (!match) return null;
      if (match.opponentId === 'bye') return { points: 3, isBye: true };
      
      let points = 0;
      if (match.result === 'win') points = 3;
      
      return { points, isBye: false };
  };

  const showColumnInfo = (column: 'OTP' | 'GW' | 'OGW') => {
    let info: CalculationInfo = null;
    switch (column) {
      case 'OTP':
        info = {
          title: 'Opponent Total Points (OTP)',
          description: (
            <>
              <p>This is the first tiebreaker. It is the sum of the match points of all the opponents you have faced.</p>
              <br />
              <p>A higher OTP indicates you have played against opponents who have performed better in the tournament.</p>
            </>
          ),
        };
        break;
      case 'GW':
        info = {
          title: 'Game Win % (GW%)',
          description: (
            <>
              <p>This is the second tiebreaker. It is your total number of game wins divided by the total number of games you played.</p>
              <br />
              <p><strong>Formula:</strong> (Total Games Won) / (Total Games Played)</p>
            </>
          ),
        };
        break;
      case 'OGW':
        info = {
          title: 'Opponent Game Win % (OGW%)',
          description: (
            <>
              <p>This is the third and final tiebreaker. It is the average of all of your opponents' game win percentages.</p>
              <br />
              <p><strong>Formula:</strong> (Sum of all opponents' GW%) / (Number of opponents)</p>
            </>
          ),
        };
        break;
    }
    setCalculationInfo(info);
  };

  const showPlayerCalcInfo = (player: StandingsPlayer, metric: 'OTP' | 'GW' | 'OGW') => {
    let info: CalculationInfo = null;
    
    switch (metric) {
        case 'GW':
            info = {
                title: `Game Win % for ${player.name}`,
                description: (
                    <div>
                        <p><strong>Calculation:</strong></p>
                        <p>Total Games Won / Total Games Played</p>
                        <p className="font-mono bg-muted p-2 rounded-md mt-2">
                           {player.gameWins} / {player.gamesPlayed} = <strong>{(player.gwPercentage * 100).toFixed(1)}%</strong>
                        </p>
                    </div>
                )
            };
            break;
        case 'OTP':
            const opponents = player.opponentIds.map(id => playerMap.get(id)).filter((p): p is Player => !!p && p.id !== 'bye');

            info = {
                title: `Opponent Total Points for ${player.name}`,
                description: (
                    <div>
                        <p><strong>Opponents' Points:</strong></p>
                        <ul className="list-disc pl-5 my-2 text-sm space-y-1">
                            {opponents.map(opp => <li key={opp.id}>{opp.name}: {opp.points} pts</li>)}
                        </ul>
                        <p><strong>Calculation:</strong></p>
                         <p className="font-mono bg-muted p-2 rounded-md mt-2 text-xs overflow-auto">
                           {opponents.map(o => `${o.points}`).join(' + ')} = <strong>{player.opponentTotalPoints}</strong>
                        </p>
                    </div>
                )
            };
            break;
         case 'OGW':
            const ogwOpponents = player.opponentIds.map(id => playerMap.get(id)).filter((p): p is StandingsPlayer => !!p && p.id !== 'bye');
             const ogwDetails = ogwOpponents.map(opp => {
                const gw = opp.gamesPlayed > 0 ? opp.gameWins / opp.gamesPlayed : 0;
                return { name: opp.name, gw };
            });
            
            info = {
                title: `Opponent Game Win % for ${player.name}`,
                description: (
                    <div>
                        <p><strong>Opponents' GW%:</strong></p>
                         <ul className="list-disc pl-5 my-2 text-sm space-y-1">
                            {ogwDetails.map(opp => <li key={opp.name}>{opp.name}: {(opp.gw * 100).toFixed(1)}%</li>)}
                        </ul>
                        <p><strong>Calculation:</strong></p>
                        <p className="font-mono bg-muted p-2 rounded-md mt-2 text-xs overflow-auto">
                           ({ogwDetails.map(o => `${(o.gw * 100).toFixed(1)}%`).join(' + ')}) / {ogwDetails.length} = <strong>{(player.ogwPercentage * 100).toFixed(1)}%</strong>
                        </p>
                    </div>
                )
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
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Rank</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Points</TableHead>
            <TableHead>
                <div className="flex items-center gap-1">
                    Opponent Points
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => showColumnInfo('OTP')}>
                        <Info className="w-3 h-3" />
                    </Button>
                </div>
            </TableHead>
            <TableHead>
                <div className="flex items-center gap-1">
                    GW%
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => showColumnInfo('GW')}>
                        <Info className="w-3 h-3" />
                    </Button>
                </div>
            </TableHead>
            <TableHead>
                <div className="flex items-center gap-1">
                    OGW%
                     <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => showColumnInfo('OGW')}>
                        <Info className="w-3 h-3" />
                    </Button>
                </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player, index) => (
            <TableRow key={player.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">{player.name}</TableCell>
              <TableCell>{player.points}</TableCell>
              <TableCell>
                  <button className="underline" onClick={() => showPlayerCalcInfo(player, 'OTP')}>
                    {player.opponentTotalPoints}
                  </button>
              </TableCell>
              <TableCell>
                  <button className="underline" onClick={() => showPlayerCalcInfo(player, 'GW')}>
                    {(player.gwPercentage * 100).toFixed(1)}%
                  </button>
              </TableCell>
              <TableCell>
                  <button className="underline" onClick={() => showPlayerCalcInfo(player, 'OGW')}>
                    {(player.ogwPercentage * 100).toFixed(1)}%
                  </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
