import { Component, Directive, HostBinding, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { LucideIcons } from '../../core/icons';

// Ported from sheet.tsx. Same composition pattern as ui/dialog/dialog-parts.ts.

@Directive({ selector: '[appSheetHeader]', standalone: true })
export class SheetHeaderDirective {
  @HostBinding('class') readonly hostClass = 'flex flex-col space-y-2 text-center sm:text-left';
}

@Directive({ selector: '[appSheetFooter]', standalone: true })
export class SheetFooterDirective {
  @HostBinding('class') readonly hostClass = 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2';
}

@Directive({ selector: '[appSheetTitle]', standalone: true })
export class SheetTitleDirective {
  @HostBinding('class') readonly hostClass = 'text-lg font-semibold text-foreground';
}

@Directive({ selector: '[appSheetDescription]', standalone: true })
export class SheetDescriptionDirective {
  @HostBinding('class') readonly hostClass = 'text-sm text-muted-foreground';
}

@Component({
  selector: 'app-sheet-close',
  standalone: true,
  imports: [LucideIcons],
  template: `
    <button
      type="button"
      class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      (click)="close()"
    >
      <lucide-icon name="X" [size]="16" />
      <span class="sr-only">Cerrar</span>
    </button>
  `,
})
export class SheetCloseButtonComponent {
  private readonly dialogRef = inject(DialogRef, { optional: true });

  close(): void {
    this.dialogRef?.close();
  }
}
