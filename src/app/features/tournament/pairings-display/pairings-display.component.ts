import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { ButtonDirective } from '../../../ui/button/button.directive';
import { CardDirective, CardContentDirective } from '../../../ui/card/card.directive';
import { LucideIcons } from '../../../core/icons';
import { TournamentService } from '../../../core/services/tournament.service';
import { ConfirmDialogService } from '../../../ui/dialog/confirm-dialog.service';
import { ManualPairingEditorComponent } from '../manual-pairing-editor/manual-pairing-editor.component';
import { ScoreSelectorComponent } from './score-selector/score-selector.component';
import type { DisplayPairing, ManualPairing, Player, StandingsPlayer, Tournament } from '../../../core/models/types';

interface ResultDraft {
  p1: string;
  p2: string;
}

@Component({
  selector: 'app-pairings-display',
  standalone: true,
  imports: [ButtonDirective, CardDirective, CardContentDirective, LucideIcons, ManualPairingEditorComponent, ScoreSelectorComponent],
  templateUrl: './pairings-display.component.html',
})
export class PairingsDisplayComponent implements OnChanges {
  @Input({ required: true }) pairings!: DisplayPairing[];
  @Input({ required: true }) roundNumber!: number;
  @Input({ required: true }) isEditable!: boolean;
  @Input({ required: true }) allPlayers!: Player[];
  @Input({ required: true }) isViewingHistory!: boolean;
  @Input({ required: true }) standings!: StandingsPlayer[];
  @Input({ required: true }) tournament!: Tournament;

  private readonly tournamentService = inject(TournamentService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  protected readonly isEditing = signal(false);
  protected readonly results = signal<Record<string, ResultDraft>>({});

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['roundNumber']) {
      this.isEditing.set(false);
    }
    if (changes['pairings']) {
      const initial: Record<string, ResultDraft> = {};
      for (const p of this.pairings) {
        if (p.player2.id !== 'bye') {
          initial[p.player1.id] = { p1: p.result?.p1Games ?? '0', p2: p.result?.p2Games ?? '0' };
        }
      }
      this.results.set(initial);
    }
  }

  resultFor(pairingId: string): ResultDraft {
    return this.results()[pairingId] ?? { p1: '0', p2: '0' };
  }

  handleResultChange(pairingId: string, player: 'p1' | 'p2', value: string): void {
    this.results.update((prev) => ({ ...prev, [pairingId]: { ...(prev[pairingId] ?? { p1: '0', p2: '0' }), [player]: value } }));
  }

  private performSubmit(): void {
    const resultsToSubmit: { p1Id: string; p2Id: string | null; p1Games: number; p2Games: number }[] = [];
    for (const pairing of this.pairings) {
      if (pairing.player2.id === 'bye') continue;
      const p1Id = pairing.player1.id;
      const result = this.results()[p1Id];
      const p2Id = (pairing.player2 as Player).id;
      const p1Games = result ? parseInt(result.p1, 10) : 0;
      const p2Games = result ? parseInt(result.p2, 10) : 0;
      if (!Number.isNaN(p1Games) && !Number.isNaN(p2Games)) {
        if (p1Games === 2 && p2Games === 2) {
          console.error(`Invalid score 2-2 for match: ${pairing.player1.name} vs ${pairing.player2.name}`);
          continue;
        }
        resultsToSubmit.push({ p1Id, p2Id, p1Games, p2Games });
      }
    }

    if (resultsToSubmit.length > 0 || this.pairings.some((p) => p.player2.id === 'bye')) {
      this.tournamentService.submitResults(this.roundNumber - 1, resultsToSubmit);
    }
  }

  async handleSubmitAll(): Promise<void> {
    if (this.isViewingHistory) {
      const confirmed = await this.confirmDialog.confirm({
        title: '¿Confirmar edición histórica?',
        description: `Estás a punto de modificar la ronda ${this.roundNumber}. Esto eliminará todas las rondas futuras y no se puede deshacer.`,
        confirmLabel: 'Confirmar y Continuar',
      });
      if (confirmed) this.performSubmit();
    } else {
      this.performSubmit();
    }
  }

  handleSavePairings(newPairings: ManualPairing[]): void {
    this.tournamentService.updatePairings(newPairings);
    this.isEditing.set(false);
  }

  handleEditClick(): void {
    this.tournamentService.rollbackToRound(this.roundNumber - 1);
  }

  isRoundSubmitted(): boolean {
    return this.pairings.length > 0 && this.pairings.every((p) => p.isSubmitted);
  }

  pairingCardClass(pairing: DisplayPairing): string {
    if (pairing.isRematch) return 'border-destructive bg-destructive/10';
    if (!this.isEditable) return 'border-primary/20';
    return '';
  }
}
