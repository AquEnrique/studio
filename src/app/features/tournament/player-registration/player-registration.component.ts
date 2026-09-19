import { Component, inject, signal } from '@angular/core';
import { ButtonDirective } from '../../../ui/button/button.directive';
import { InputDirective } from '../../../ui/input/input.directive';
import { LucideIcons } from '../../../core/icons';
import { CardDirective, CardContentDirective, CardDescriptionDirective, CardHeaderDirective, CardTitleDirective } from '../../../ui/card/card.directive';
import { TabsComponent, TabsContentComponent, TabsListComponent, TabsTriggerComponent } from '../../../ui/tabs/tabs.component';
import { TournamentService } from '../../../core/services/tournament.service';
import { getRecommendedRounds } from '../../../core/lib/tournament-logic';
import { ManualPairingComponent } from '../manual-pairing/manual-pairing.component';

@Component({
  selector: 'app-player-registration',
  standalone: true,
  imports: [
    ButtonDirective,
    InputDirective,
    LucideIcons,
    CardDirective,
    CardHeaderDirective,
    CardTitleDirective,
    CardDescriptionDirective,
    CardContentDirective,
    TabsComponent,
    TabsListComponent,
    TabsTriggerComponent,
    TabsContentComponent,
    ManualPairingComponent,
  ],
  templateUrl: './player-registration.component.html',
})
export class PlayerRegistrationComponent {
  protected readonly tournament = inject(TournamentService);
  protected readonly newPlayerName = signal('');
  protected readonly getRecommendedRounds = getRecommendedRounds;

  addPlayer(): void {
    const name = this.newPlayerName().trim();
    if (name) {
      this.tournament.addPlayer(name);
      this.newPlayerName.set('');
    }
  }

  onEnter(event: Event): void {
    event.preventDefault();
    this.addPlayer();
  }
}
