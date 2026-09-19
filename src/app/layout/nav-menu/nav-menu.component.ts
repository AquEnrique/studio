import { Component, inject } from '@angular/core';
import { ButtonDirective } from '../../ui/button/button.directive';
import { LucideIcons } from '../../core/icons';
import { SheetService } from '../../ui/sheet/sheet.service';
import { NavMenuSheetComponent } from './nav-menu-sheet.component';

@Component({
  selector: 'app-nav-menu',
  standalone: true,
  imports: [ButtonDirective, LucideIcons],
  template: `
    <button appButton variant="ghost" size="icon" class="-ml-2 shrink-0" aria-label="Abrir menú" (click)="openMenu()">
      <lucide-icon name="Menu" [size]="20" />
    </button>
  `,
})
export class NavMenuComponent {
  private readonly sheet = inject(SheetService);

  openMenu(): void {
    this.sheet.open(NavMenuSheetComponent, { side: 'left' });
  }
}
