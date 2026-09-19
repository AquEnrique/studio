import { Component, ElementRef, Input, ViewChild, inject } from '@angular/core';
import { ButtonDirective } from '../../../ui/button/button.directive';
import { LucideIcons } from '../../../core/icons';
import { TournamentService } from '../../../core/services/tournament.service';
import { ClockService } from '../../../core/services/clock.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../ui/dialog/confirm-dialog.service';
import type { DisplayPairing, StandingsPlayer } from '../../../core/models/types';

@Component({
  selector: 'app-tournament-controls',
  standalone: true,
  imports: [ButtonDirective, LucideIcons],
  templateUrl: './tournament-controls.component.html',
})
export class TournamentControlsComponent {
  @Input({ required: true }) status!: 'registration' | 'running' | 'finished';
  @Input({ required: true }) playerCount!: number;
  @Input() isMobile = false;
  @Input() allResultsSubmitted = false;
  @Input() isViewingHistory = false;
  @Input() currentRound?: number;
  @Input() isJudgeView = false;
  @Input() currentPairings?: DisplayPairing[];
  @Input() roundsGenerated?: number;
  @Input() recommendedRounds?: number;
  @Input() standings?: StandingsPlayer[];

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  protected readonly tournament = inject(TournamentService);
  protected readonly clock = inject(ClockService);
  private readonly toast = inject(ToastService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  get isChecklistCopyMode(): boolean {
    return this.allResultsSubmitted && !this.isViewingHistory;
  }

  get recommendedRoundsReached(): boolean {
    return typeof this.roundsGenerated === 'number' && typeof this.recommendedRounds === 'number' && this.roundsGenerated >= this.recommendedRounds;
  }

  handleStartTimer(): void {
    this.clock.requestNotificationPermission();
    this.clock.startRoundTimer();
    this.toast.toast({ title: '¡Ronda iniciada!', description: 'El reloj de 50 minutos ha comenzado.' });
  }

  handleStopTimer(): void {
    this.clock.resetRoundTimer();
    this.toast.toast({ title: 'Reloj detenido', description: 'El reloj de la ronda ha sido reiniciado.' });
  }

  async handleResetTournament(): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: '¿Estás seguro?',
      description: 'Esto eliminará todos los jugadores, rondas y clasificaciones. Esta acción no se puede deshacer.',
      confirmLabel: 'Reiniciar',
      variant: 'destructive',
    });
    if (!confirmed) return;
    this.clock.resetRoundTimer();
    this.tournament.resetTournament();
  }

  handleImportClick(): void {
    this.fileInput?.nativeElement.click();
  }

  handleFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        try {
          this.tournament.importTournament(content);
        } catch (error) {
          console.error('Importación fallida:', error);
          this.toast.toast({ variant: 'destructive', title: 'Importación Fallida', description: 'El archivo seleccionado no es un archivo de torneo válido.' });
        }
      };
      reader.readAsText(file);
    }
    input.value = '';
  }

  async handleForceSave(): Promise<void> {
    const success = await this.tournament.forceSaveTournament();
    if (success) {
      this.toast.toast({ title: '¡Guardado!', description: 'El estado del torneo ha sido sincronizado.' });
    } else {
      this.toast.toast({ variant: 'destructive', title: 'Error', description: 'No se pudo sincronizar el estado del torneo.' });
    }
  }

  handleCopy(): void {
    const pairings = this.currentPairings;
    const currentRound = this.currentRound;
    if (!pairings || !currentRound) return;

    let text: string;

    if (this.allResultsSubmitted && !this.isViewingHistory) {
      const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
      let participantNames: string[];
      if (this.standings && this.standings.length > 0) {
        participantNames = this.standings.map((s) => s.playerName);
      } else {
        participantNames = [];
        pairings.forEach((p) => {
          participantNames.push(p.player1.name);
          if (p.player2.id !== 'bye') participantNames.push(p.player2.name);
        });
      }

      text = `Torneo ${today}\nParticipantes:\n\n`;
      participantNames.forEach((name) => {
        text += `${name} ✅❌\n`;
      });
      text += `\nLink del torneo: https://tournamentygo-fortaleza.netlify.app/`;
    } else {
      text = `RONDA ${currentRound}\n\n`;
      pairings.forEach((p, index) => {
        text += `${index + 1}. ${p.player1.name} vs ${p.player2.name}\n`;
      });
      text += `\nLink del torneo: https://tournamentygo-fortaleza.netlify.app/`;
    }

    navigator.clipboard.writeText(text);
    this.toast.toast({ title: '¡Copiado!', description: 'Los emparejamientos han sido copiados al portapapeles.' });
  }

  generateNextRound(): void {
    this.tournament.generateNextRound();
  }

  startTournament(): void {
    this.tournament.startTournament();
  }
}
