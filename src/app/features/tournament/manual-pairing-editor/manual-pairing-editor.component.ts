import { Component, EventEmitter, Input, OnChanges, Output, computed, signal } from '@angular/core';
import { ButtonDirective } from '../../../ui/button/button.directive';
import { CardDirective, CardContentDirective } from '../../../ui/card/card.directive';
import { AlertDirective, AlertTitleDirective, AlertDescriptionDirective } from '../../../ui/alert/alert.directive';
import { LucideIcons } from '../../../core/icons';
import { calculateStandings } from '../../../core/lib/tournament-logic';
import type { DisplayPairing, ManualPairing, Player, StandingsPlayer, Tournament } from '../../../core/models/types';

@Component({
  selector: 'app-manual-pairing-editor',
  standalone: true,
  imports: [ButtonDirective, CardDirective, CardContentDirective, AlertDirective, AlertTitleDirective, AlertDescriptionDirective, LucideIcons],
  templateUrl: './manual-pairing-editor.component.html',
})
export class ManualPairingEditorComponent implements OnChanges {
  @Input({ required: true }) players!: Player[];
  @Input({ required: true }) initialPairings!: DisplayPairing[];
  @Input({ required: true }) roundNumber!: number;
  @Input({ required: true }) standings!: StandingsPlayer[];
  @Input({ required: true }) tournament!: Tournament;
  @Output() save = new EventEmitter<ManualPairing[]>();
  @Output() cancel = new EventEmitter<void>();

  protected readonly unpairedPlayers = signal<Player[]>([]);
  protected readonly pairings = signal<ManualPairing[]>([]);
  protected readonly selectedPlayer = signal<Player | null>(null);

  protected readonly rankMap = computed(() => new Map(this.standings.map((p, i) => [p.playerId, i + 1])));

  protected readonly pastOpponentsStandingsMap = computed(() => {
    const historical: Tournament = { ...this.tournament, rounds: this.tournament.rounds.slice(0, this.roundNumber - 1) };
    return new Map(calculateStandings(historical).map((p) => [p.playerId, p]));
  });

  protected readonly pastOpponentIds = computed(() => {
    const selected = this.selectedPlayer();
    if (!selected) return new Set<string>();
    return new Set(this.pastOpponentsStandingsMap().get(selected.id)?.opponentIds || []);
  });

  ngOnChanges(): void {
    const pairedPlayerIds = new Set(
      this.initialPairings.flatMap((p) => {
        const ids = [p.player1.id];
        if (p.player2.id !== 'bye') ids.push(p.player2.id);
        return ids;
      })
    );

    this.unpairedPlayers.set(
      this.standings.filter((p) => !pairedPlayerIds.has(p.playerId)).map((p) => ({ id: p.playerId, name: p.playerName }))
    );
    this.pairings.set(this.initialPairings.map((p) => ({ player1: p.player1, player2: p.player2 })));
    this.selectedPlayer.set(null);
  }

  hasBye(): boolean {
    return this.pairings().some((p) => p.player2.id === 'bye');
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

    const rankedPlayerIds = this.standings.map((p) => p.playerId);
    const newUnpaired = [...this.unpairedPlayers(), ...playersToAddBack].sort((a, b) => {
      const rankA = rankedPlayerIds.indexOf(a.id);
      const rankB = rankedPlayerIds.indexOf(b.id);
      if (rankA === -1) return 1;
      if (rankB === -1) return -1;
      return rankA - rankB;
    });
    this.unpairedPlayers.set(newUnpaired);
    this.selectedPlayer.set(null);
  }

  cleanPairings(): void {
    const pairedPlayers = this.pairings().flatMap((p) => {
      const players: Player[] = [p.player1];
      if (p.player2.id !== 'bye') players.push(p.player2 as Player);
      return players;
    });
    const allPlayerIds = [...this.unpairedPlayers(), ...pairedPlayers].map((p) => p.id);
    this.unpairedPlayers.set(this.standings.filter((p) => allPlayerIds.includes(p.playerId)).map((p) => ({ id: p.playerId, name: p.playerName })));
    this.pairings.set([]);
    this.selectedPlayer.set(null);
  }

  isSaveReady(): boolean {
    return this.unpairedPlayers().length === 0 && this.players.length > 1;
  }
}
