import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DialogRef } from '@angular/cdk/dialog';
import { LucideIcons } from '../../core/icons';
import { TournamentService } from '../../core/services/tournament.service';
import { SheetHeaderDirective, SheetTitleDirective } from '../../ui/sheet/sheet-parts';

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
 * Content rendered inside the left-side Sheet opened by NavMenuComponent.
 * Fully retractable: stays hidden off-canvas until the header trigger opens it.
 */
@Component({
  selector: 'app-nav-menu-sheet',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideIcons, SheetHeaderDirective, SheetTitleDirective],
  template: `
    <div appSheetHeader class="border-b p-4">
      <h2 appSheetTitle>Menú</h2>
    </div>
    <nav class="flex flex-col gap-1 p-2">
      @for (item of items(); track item.href) {
        <a
          [routerLink]="item.href"
          routerLinkActive="bg-primary text-primary-foreground"
          [routerLinkActiveOptions]="{ exact: item.href === '/' }"
          (click)="close()"
          class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <lucide-icon [name]="item.icon" [size]="20" class="shrink-0" />
          {{ item.label }}
        </a>
      }
    </nav>
  `,
})
export class NavMenuSheetComponent {
  private readonly dialogRef = inject(DialogRef, { optional: true });
  private readonly tournament = inject(TournamentService);

  items(): NavItem[] {
    const isRunning = this.tournament.tournament()?.status === 'running';
    return NAV_ITEMS.filter((item) => !item.requiresRunning || isRunning);
  }

  close(): void {
    this.dialogRef?.close();
  }
}
