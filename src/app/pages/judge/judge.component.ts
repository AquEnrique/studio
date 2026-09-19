import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from '../../ui/button/button.directive';
import { AlertDirective, AlertTitleDirective, AlertDescriptionDirective } from '../../ui/alert/alert.directive';
import { LucideIcons } from '../../core/icons';
import { TournamentService } from '../../core/services/tournament.service';
import { ClockService } from '../../core/services/clock.service';
import { BreakpointService } from '../../core/services/breakpoint.service';
import { calculateStandings } from '../../core/lib/tournament-logic';
import { StandingsTableComponent } from '../../features/tournament/standings-table/standings-table.component';
import { PairingsDisplayComponent } from '../../features/tournament/pairings-display/pairings-display.component';
import { TournamentControlsComponent } from '../../features/tournament/tournament-controls/tournament-controls.component';
import type { Tournament } from '../../core/models/types';

@Component({
  selector: 'app-judge',
  standalone: true,
  imports: [
    RouterLink,
    ButtonDirective,
    AlertDirective,
    AlertTitleDirective,
    AlertDescriptionDirective,
    LucideIcons,
    StandingsTableComponent,
    PairingsDisplayComponent,
    TournamentControlsComponent,
  ],
  templateUrl: './judge.component.html',
})
export class JudgeComponent implements OnInit {
  protected readonly tournament = inject(TournamentService);
  protected readonly clock = inject(ClockService);
  protected readonly breakpoint = inject(BreakpointService);

  protected readonly currentRoundForView = computed(() => this.tournament.viewingRound() || this.tournament.tournament()?.rounds.length || 0);

  protected readonly isViewingHistory = computed(() => {
    const viewingRound = this.tournament.viewingRound();
    return viewingRound !== null && viewingRound < (this.tournament.tournament()?.rounds.length || 0);
  });

  protected readonly historicalStandings = computed(() => {
    const t = this.tournament.tournament();
    if (!t || !this.isViewingHistory()) return this.tournament.standings();
    const historical: Tournament = { ...t, rounds: t.rounds.slice(0, this.tournament.viewingRound()!) };
    return calculateStandings(historical);
  });

  protected readonly visibleStandings = computed(() => (this.isViewingHistory() ? this.historicalStandings() : this.tournament.standings()));

  ngOnInit(): void {
    this.tournament.refreshTournament();
    this.clock.refreshClock();
  }

  goToRound(round: number | null): void {
    this.tournament.goToRound(round);
  }

  goToPrevious(): void {
    const current = this.currentRoundForView();
    this.goToRound(current > 1 ? current - 1 : 1);
  }

  goToNext(): void {
    const t = this.tournament.tournament();
    if (!t) return;
    const current = this.currentRoundForView();
    this.goToRound(current < t.rounds.length ? current + 1 : t.rounds.length);
  }
}
