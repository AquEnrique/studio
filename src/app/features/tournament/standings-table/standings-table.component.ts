import { Component, Input, inject } from '@angular/core';
import { ButtonDirective } from '../../../ui/button/button.directive';
import { LucideIcons } from '../../../core/icons';
import { TableComponent, TableHeaderDirective, TableBodyDirective, TableRowDirective, TableHeadDirective, TableCellDirective } from '../../../ui/table/table.directive';
import { AccordionItemComponent, AccordionTriggerComponent, AccordionContentComponent } from '../../../ui/accordion/accordion.component';
import { ConfirmDialogService } from '../../../ui/dialog/confirm-dialog.service';
import type { RoundResult, StandingsPlayer } from '../../../core/models/types';

type Column = 'OTP' | 'GWP' | 'OGW';

const COLUMN_INFO: Record<Column, { title: string; description: string }> = {
  OTP: {
    title: 'Opponent Total Points (OTP)',
    description:
      'Este es el primer desempate. Es la suma de los puntos de partido de todos los oponentes que has enfrentado.\n\nUn OTP más alto indica que has jugado contra oponentes que han tenido un mejor desempeño en el torneo.',
  },
  GWP: {
    title: 'Game Win % (GW%)',
    description:
      'Este es el segundo desempate. Es el porcentaje de juegos individuales ganados a lo largo del torneo.\n\nFórmula: (Juegos Ganados) / (Juegos Jugados)\n\nLas rondas con bye no se incluyen en este cálculo.',
  },
  OGW: {
    title: "Opponent's Game Win % (OGW%)",
    description:
      'Este es el tercer desempate. Es el promedio del Porcentaje de Victorias en Juegos (GW%) de todos tus oponentes.\n\nUn OGW% más alto indica que has jugado contra oponentes más fuertes.\n\nPara este cálculo, el GW% de un oponente nunca se considera inferior al 33%.',
  },
};

@Component({
  selector: 'app-standings-table',
  standalone: true,
  imports: [
    ButtonDirective,
    LucideIcons,
    TableComponent,
    TableHeaderDirective,
    TableBodyDirective,
    TableRowDirective,
    TableHeadDirective,
    TableCellDirective,
    AccordionItemComponent,
    AccordionTriggerComponent,
    AccordionContentComponent,
  ],
  templateUrl: './standings-table.component.html',
})
export class StandingsTableComponent {
  @Input({ required: true }) players!: StandingsPlayer[];
  @Input({ required: true }) view!: 'simple' | 'advanced' | 'judge';
  @Input({ required: true }) maxRounds!: number;
  @Input({ required: true }) isMobile!: boolean;

  private readonly confirmDialog = inject(ConfirmDialogService);

  showColumnInfo(column: Column): void {
    const info = COLUMN_INFO[column];
    this.confirmDialog.info({ title: info.title, description: info.description });
  }

  rounds(): number[] {
    return Array.from({ length: this.maxRounds }, (_, i) => i + 1);
  }

  emptyCells(player: StandingsPlayer): number[] {
    return Array.from({ length: Math.max(0, this.maxRounds - player.roundResults.length) });
  }

  simpleCellContent(result: RoundResult): string {
    if (!result) return '-';
    if (result.isBye) return 'BYE';
    return result.wins === 2 ? '3' : '0';
  }

  simpleCellClass(result: RoundResult): string {
    if (!result) return 'text-muted-foreground';
    if (result.isBye) return 'text-warning';
    if (result.wins === 2) return 'text-success';
    if (result.losses === 2) return 'text-destructive';
    return 'text-muted-foreground';
  }

  resultTextClass(result: RoundResult): string {
    if (!result) return '';
    if (result.isBye) return 'text-warning';
    if (result.wins > result.losses) return 'text-success';
    if (result.losses > result.wins) return 'text-destructive';
    return '';
  }

  resultLabel(result: RoundResult): string {
    if (!result) return '-';
    return result.isBye ? 'BYE' : `${result.wins}/${result.losses}`;
  }
}
