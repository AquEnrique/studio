import { Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { LucideIcons } from '../../../core/icons';
import { DialogCloseButtonComponent, DialogHeaderDirective, DialogTitleDirective } from '../../../ui/dialog/dialog-parts';

export interface LpKeypadData {
  label: string;
  currentValue: number;
  accent: 'primary' | 'accent';
}

const DIGIT_ROWS = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];
const MAX_DIGITS = 6;

/**
 * Compact on-screen keypad for entering a custom amount and applying it to a
 * player's life points as either a gain (+) or a loss (-), without relying on
 * the device's native keyboard. Closes itself with the delta to apply, or
 * `undefined` if dismissed (backdrop click, Escape, or the close button)
 * without applying anything.
 */
@Component({
  selector: 'app-lp-keypad-dialog',
  standalone: true,
  imports: [LucideIcons, DialogHeaderDirective, DialogTitleDirective, DialogCloseButtonComponent],
  templateUrl: './lp-keypad-dialog.component.html',
})
export class LpKeypadDialogComponent {
  protected readonly data = inject<LpKeypadData>(DIALOG_DATA);
  private readonly dialogRef = inject<DialogRef<number, LpKeypadDialogComponent>>(DialogRef);

  protected readonly digitRows = DIGIT_ROWS;
  protected readonly staged = signal('0');
  protected readonly accentTextClass = this.data.accent === 'primary' ? 'text-primary' : 'text-accent';

  protected stagedValue(): number {
    return parseInt(this.staged(), 10) || 0;
  }

  pushDigit(digit: string): void {
    this.staged.update((prev) => {
      const next = prev === '0' ? digit : prev + digit;
      return next.length > MAX_DIGITS ? prev : next;
    });
  }

  backspace(): void {
    this.staged.update((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
  }

  clear(): void {
    this.staged.set('0');
  }

  // Applying an operation always closes the dialog so the updated total is
  // immediately visible on the player panel.
  apply(sign: 1 | -1): void {
    const value = this.stagedValue();
    if (value === 0) return;
    this.dialogRef.close(value * sign);
  }

  private applyDirect(delta: number): void {
    if (delta === 0) return;
    this.dialogRef.close(delta);
  }

  applyDouble(): void {
    this.applyDirect(this.data.currentValue);
  }

  // Halving with a remainder always rounds the kept half up: e.g. 11 -> the 5
  // (floor half) is subtracted, leaving 6 (ceil half).
  applyHalve(): void {
    this.applyDirect(-Math.floor(this.data.currentValue / 2));
  }
}
