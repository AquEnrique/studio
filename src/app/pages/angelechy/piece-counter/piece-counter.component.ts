import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ButtonDirective } from '../../../ui/button/button.directive';
import { LucideIcons } from '../../../core/icons';
import { HoldRepeat } from '../../../core/lib/hold-repeat';

@Component({
  selector: 'app-piece-counter',
  standalone: true,
  imports: [ButtonDirective, LucideIcons],
  templateUrl: './piece-counter.component.html',
})
export class PieceCounterComponent {
  @Input({ required: true }) symbol!: string;
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: number;
  @Output() adjust = new EventEmitter<number>();
  @Output() reset = new EventEmitter<void>();

  protected readonly flash = signal<{ id: number; text: string } | null>(null);
  private flashTimeout?: ReturnType<typeof setTimeout>;
  private readonly holdRepeat = new HoldRepeat();

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

  ngOnDestroy(): void {
    this.stopHold();
    clearTimeout(this.flashTimeout);
  }
}
