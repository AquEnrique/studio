import { Component, Directive, HostBinding, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { LucideIcons } from '../../core/icons';

// Presentational pieces for content authors composing whatever component they
// pass to `Dialog.open()` / `SheetService.open()`. Ported from dialog.tsx.

@Directive({ selector: '[appDialogHeader]', standalone: true })
export class DialogHeaderDirective {
  @HostBinding('class') readonly hostClass = 'flex flex-col space-y-1.5 text-center sm:text-left';
}

@Directive({ selector: '[appDialogFooter]', standalone: true })
export class DialogFooterDirective {
  @HostBinding('class') readonly hostClass = 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2';
}

@Directive({ selector: '[appDialogTitle]', standalone: true })
export class DialogTitleDirective {
  @HostBinding('class') readonly hostClass = 'text-lg font-semibold leading-none tracking-tight';
}

@Directive({ selector: '[appDialogDescription]', standalone: true })
export class DialogDescriptionDirective {
  @HostBinding('class') readonly hostClass = 'text-sm text-muted-foreground';
}

@Component({
  selector: 'app-dialog-close',
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
export class DialogCloseButtonComponent {
  private readonly dialogRef = inject(DialogRef, { optional: true });

  close(): void {
    this.dialogRef?.close();
  }
}
