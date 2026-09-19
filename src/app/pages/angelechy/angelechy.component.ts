import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonDirective } from '../../ui/button/button.directive';
import { LucideIcons } from '../../core/icons';
import { AngelechyCountersService } from '../../core/services/angelechy-counters.service';
import { PieceCounterComponent } from './piece-counter/piece-counter.component';

@Component({
  selector: 'app-angelechy',
  standalone: true,
  imports: [RouterLink, ButtonDirective, LucideIcons, PieceCounterComponent],
  templateUrl: './angelechy.component.html',
})
export class AngelechyComponent {
  protected readonly counters = inject(AngelechyCountersService);
}
