import { Injectable, inject } from '@angular/core';
import { ComponentType } from '@angular/cdk/portal';
import { Dialog, DialogRef } from '@angular/cdk/dialog';

export type SheetSide = 'top' | 'bottom' | 'left' | 'right';

// Ported from sheetVariants in the old sheet.tsx.
const SIDE_CLASSES: Record<SheetSide, string> = {
  top: 'inset-x-0 top-0 border-b',
  bottom: 'inset-x-0 bottom-0 border-t',
  left: 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
  right: 'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
};

// Starting (off-screen) transform per side; removed one frame after open to
// trigger the CSS transition defined on .app-sheet-panel.
const CLOSED_TRANSFORM: Record<SheetSide, string> = {
  top: '-translate-y-full',
  bottom: 'translate-y-full',
  left: '-translate-x-full',
  right: 'translate-x-full',
};

export interface SheetOptions<D> {
  side?: SheetSide;
  data?: D;
}

/**
 * Slide-in panel (the old Radix `Sheet`), built on the same `@angular/cdk/dialog`
 * `Dialog` service as ConfirmDialogService - same backdrop/focus-trap/escape-to-close
 * behavior, different panel placement + entry transform.
 */
@Injectable({ providedIn: 'root' })
export class SheetService {
  private readonly dialog = inject(Dialog);

  open<T, D = unknown>(component: ComponentType<T>, options: SheetOptions<D> = {}): DialogRef<unknown, T> {
    const side = options.side ?? 'right';
    const closedTransformClasses = CLOSED_TRANSFORM[side].split(' ');

    const ref = this.dialog.open<unknown, D, T>(component, {
      data: options.data,
      panelClass: ['app-sheet-panel', ...SIDE_CLASSES[side].split(' '), ...closedTransformClasses],
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
    });

    const panelEl = ref.overlayRef.overlayElement;
    requestAnimationFrame(() => {
      panelEl.classList.remove(...closedTransformClasses);
      panelEl.classList.add('translate-x-0', 'translate-y-0');
    });

    return ref;
  }
}
