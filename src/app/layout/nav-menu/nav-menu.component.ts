import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideIcons } from '../../core/icons';
import { TournamentService } from '../../core/services/tournament.service';
import { BreakpointService } from '../../core/services/breakpoint.service';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  requiresRunning: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Torneo', icon: 'Home', requiresRunning: false },
  { href: '/judge', label: 'Vista de Juez', icon: 'Gavel', requiresRunning: true },
  { href: '/life-points', label: 'Puntos de Vida', icon: 'Heart', requiresRunning: false },
  { href: '/angelechy', label: 'Angelechy', icon: 'Crown', requiresRunning: false },
];

/**
 * Persistent side menu. Fully retractable to width 0, leaving only the toggle
 * tab visible attached to its edge (it's a flex sibling of the panel, so it
 * slides with it instead of needing manual position math).
 */
@Component({
  selector: 'app-nav-menu',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideIcons],
  template: `
    <div class="flex h-full items-start bg-background">
      <aside
        class="h-full overflow-hidden border-r transition-[width] duration-300 ease-in-out"
        [class.w-64]="open()"
        [class.w-0]="!open()"
      >
        <div class="flex h-full w-64 flex-col">
          <div class="border-b p-4">
            <h2 class="text-lg font-semibold text-foreground">Menú</h2>
          </div>
          <nav class="flex flex-col gap-1 p-2">
            @for (item of items(); track item.href) {
              <a
                [routerLink]="item.href"
                routerLinkActive="bg-primary text-primary-foreground"
                [routerLinkActiveOptions]="{ exact: item.href === '/' }"
                (click)="onNavigate()"
                class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <lucide-icon [name]="item.icon" [size]="20" class="shrink-0" />
                {{ item.label }}
              </a>
            }
          </nav>
        </div>
      </aside>

      <button
        type="button"
        class="mt-4 flex h-10 w-6 shrink-0 items-center justify-center rounded-r-md border border-l-0 bg-background shadow-md hover:bg-accent"
        [attr.aria-label]="open() ? 'Cerrar menú' : 'Abrir menú'"
        (click)="toggle()"
      >
        <lucide-icon [name]="open() ? 'ChevronsLeft' : 'ChevronsRight'" [size]="16" />
      </button>
    </div>
  `,
})
export class NavMenuComponent {
  private readonly tournament = inject(TournamentService);
  private readonly breakpoint = inject(BreakpointService);

  protected readonly open = signal(!this.breakpoint.isMobile());

  protected readonly items = computed<NavItem[]>(() => {
    const isRunning = this.tournament.tournament()?.status === 'running';
    return NAV_ITEMS.filter((item) => !item.requiresRunning || isRunning);
  });

  toggle(): void {
    this.open.update((value) => !value);
  }

  onNavigate(): void {
    if (this.breakpoint.isMobile()) {
      this.open.set(false);
    }
  }
}
