import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { ButtonDirective } from '../../../ui/button/button.directive';
import { CardDirective, CardContentDirective } from '../../../ui/card/card.directive';
import { AlertDirective, AlertTitleDirective, AlertDescriptionDirective } from '../../../ui/alert/alert.directive';
import { LucideIcons } from '../../../core/icons';
import { TournamentService } from '../../../core/services/tournament.service';
import type { ManualPairing, Player } from '../../../core/models/types';

@Component({
  selector: 'app-manual-pairing',
  standalone: true,
  imports: [ButtonDirective, CardDirective, CardContentDirective, AlertDirective, AlertTitleDirective, AlertDescriptionDirective, LucideIcons],
  templateUrl: './manual-pairing.component.html',
})
export class ManualPairingComponent implements OnChanges {
  @Input({ required: true }) players!: Player[];

  private readonly tournament = inject(TournamentService);

  protected readonly unpairedPlayers = signal<Player[]>([]);
  protected readonly pairings = signal<ManualPairing[]>([]);
  protected readonly selectedPlayer = signal<Player | null>(null);

  ngOnChanges(): void {
    this.unpairedPlayers.set([...this.players].sort((a, b) => a.name.localeCompare(b.name)));
    this.pairings.set([]);
    this.selectedPlayer.set(null);
  }

  handlePlayerClick(player: Player): void {
    const selected = this.selectedPlayer();
    if (selected) {
      if (selected.id === player.id) {
        this.selectedPlayer.set(null);
      } else {
        this.pairings.update((prev) => [...prev, { player1: selected, player2: player }]);
        this.unpairedPlayers.update((prev) => prev.filter((p) => p.id !== selected.id && p.id !== player.id));
        this.selectedPlayer.set(null);
      }
    } else {
      this.selectedPlayer.set(player);
    }
  }

  hasBye(): boolean {
    return this.pairings().some((p) => p.player2.id === 'bye');
  }

  handleAssignBye(): void {
    const selected = this.selectedPlayer();
    if (!selected || this.hasBye()) return;
    this.pairings.update((prev) => [...prev, { player1: selected, player2: { id: 'bye', name: 'BYE' } }]);
    this.unpairedPlayers.update((prev) => prev.filter((p) => p.id !== selected.id));
    this.selectedPlayer.set(null);
  }

  removePairing(index: number): void {
    const pairingToRemove = this.pairings()[index];
    const playersToAddBack: Player[] = [pairingToRemove.player1];
    if (pairingToRemove.player2.id !== 'bye') playersToAddBack.push(pairingToRemove.player2 as Player);

    this.pairings.update((prev) => prev.filter((_, i) => i !== index));
    this.unpairedPlayers.update((prev) => [...prev, ...playersToAddBack].sort((a, b) => a.name.localeCompare(b.name)));
    this.selectedPlayer.set(null);
  }

  cleanPairings(): void {
    this.unpairedPlayers.set([...this.players].sort((a, b) => a.name.localeCompare(b.name)));
    this.pairings.set([]);
    this.selectedPlayer.set(null);
  }

  isTournamentReady(): boolean {
    return this.unpairedPlayers().length === 0 && this.players.length > 1;
  }

  startTournament(): void {
    this.tournament.startManualTournament(this.pairings());
  }
}
