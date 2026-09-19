import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { ButtonDirective } from '../../ui/button/button.directive';
import { LucideIcons } from '../../core/icons';
import { TournamentService } from '../../core/services/tournament.service';
import { NavMenuComponent } from '../nav-menu/nav-menu.component';
import { ClockDisplayComponent } from '../clock-display/clock-display.component';
import { BreakpointService } from '../../core/services/breakpoint.service';
import { BadgeDirective } from '../../ui/badge/badge.directive';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, ButtonDirective, BadgeDirective, LucideIcons, NavMenuComponent, ClockDisplayComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  private readonly router = inject(Router);
  protected readonly tournament = inject(TournamentService);
  protected readonly breakpoint = inject(BreakpointService);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  protected readonly isJudgeRoute = computed(() => this.url() === '/judge');
  protected readonly isRunning = computed(() => this.tournament.tournament()?.status === 'running');
}
