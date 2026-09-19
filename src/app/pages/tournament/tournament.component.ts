import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { ButtonDirective } from '../../ui/button/button.directive';
import { LucideIcons } from '../../core/icons';
import { TournamentService } from '../../core/services/tournament.service';
import { ClockService } from '../../core/services/clock.service';
import { BreakpointService } from '../../core/services/breakpoint.service';
import { ConfirmDialogService } from '../../ui/dialog/confirm-dialog.service';
import { PlayerRegistrationComponent } from '../../features/tournament/player-registration/player-registration.component';
import { PairingsDisplayComponent } from '../../features/tournament/pairings-display/pairings-display.component';
import { StandingsTableComponent } from '../../features/tournament/standings-table/standings-table.component';
import { TournamentControlsComponent } from '../../features/tournament/tournament-controls/tournament-controls.component';

@Component({
  selector: 'app-tournament',
  standalone: true,
  imports: [
    ButtonDirective,
    LucideIcons,
    PlayerRegistrationComponent,
    PairingsDisplayComponent,
    StandingsTableComponent,
    TournamentControlsComponent,
  ],
  templateUrl: './tournament.component.html',
})
export class TournamentComponent implements OnInit {
  protected readonly tournament = inject(TournamentService);
  protected readonly clock = inject(ClockService);
  protected readonly breakpoint = inject(BreakpointService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  protected readonly standingsView = signal<'simple' | 'advanced'>('simple');

  constructor() {
    // Mirrors the old page's fully-controlled AlertDialog: as soon as an import is
    // staged, ask for confirmation before letting it overwrite the current tournament.
    effect(() => {
      const pending = this.tournament.pendingImport();
      if (!pending) return;
      this.confirmDialog
        .confirm({
          title: '¿Estás seguro de que quieres importar?',
          description: 'Esto sobrescribirá el torneo actual. Esta acción no se puede deshacer.',
          confirmLabel: 'Importar',
        })
        .then((confirmed) => {
          if (confirmed) this.tournament.confirmImport();
          else this.tournament.cancelImport();
        });
    });
  }

  ngOnInit(): void {
    this.tournament.refreshTournament();
    this.clock.refreshClock();
  }
}
