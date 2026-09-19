import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { LucideIcons } from '../../../core/icons';
import { HoldRepeat } from '../../../core/lib/hold-repeat';
import { LpKeypadDialogComponent } from '../lp-keypad-dialog/lp-keypad-dialog.component';

type Accent = 'primary' | 'accent';

@Component({
  selector: 'app-player-panel',
  standalone: true,
  imports: [LucideIcons],
  templateUrl: './player-panel.component.html',
})
export class PlayerPanelComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: number;
  @Input({ required: true }) step!: number;
  @Input({ required: true }) accent!: Accent;
  @Output() adjust = new EventEmitter<number>();

  private readonly dialog = inject(Dialog);

  protected readonly flash = signal<{ id: number; text: string } | null>(null);
  private flashTimeout?: ReturnType<typeof setTimeout>;
  private readonly holdRepeat = new HoldRepeat();

  protected get accentClasses(): string {
    return this.accent === 'primary' ? 'border-primary/30 bg-primary/5' : 'border-accent/30 bg-accent/5';
  }

  private showFlash(delta: number): void {
    clearTimeout(this.flashTimeout);
    this.flash.set({ id: Date.now(), text: `${delta > 0 ? '+' : ''}${delta}` });
    this.flashTimeout = setTimeout(() => this.flash.set(null), 900);
  }

  private handleAdjust(delta: number): void {
    this.adjust.emit(delta);
    this.showFlash(delta);
  }

  startHold(delta: number): void {
    this.holdRepeat.start(() => this.handleAdjust(delta));
  }

  stopHold(): void {
    this.holdRepeat.stop();
  }

  openKeypad(): void {
    const ref = this.dialog.open<number, { label: string; currentValue: number; accent: Accent }, LpKeypadDialogComponent>(
      LpKeypadDialogComponent,
      {
        data: { label: this.label, currentValue: this.value, accent: this.accent },
        panelClass: ['app-lp-keypad-panel'],
        hasBackdrop: true,
        backdropClass: 'cdk-overlay-dark-backdrop',
      }
    );
    ref.closed.subscribe((delta) => {
      if (typeof delta === 'number') this.handleAdjust(delta);
    });
  }

  ngOnDestroy(): void {
    this.stopHold();
    clearTimeout(this.flashTimeout);
  }
}
