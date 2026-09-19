import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonDirective } from '../../../../ui/button/button.directive';

@Component({
  selector: 'app-score-selector',
  standalone: true,
  imports: [ButtonDirective],
  template: `
    <div class="flex justify-center gap-2">
      @for (val of [0, 1, 2]; track val) {
        <button
          appButton
          [variant]="score === String(val) ? 'secondary' : 'outline'"
          size="icon"
          class="h-11 w-11 rounded-full text-base"
          (click)="scoreChange.emit(String(val))"
          [disabled]="disabled || (val === 2 && otherPlayerScore === '2')"
        >
          {{ val }}
        </button>
      }
    </div>
  `,
})
export class ScoreSelectorComponent {
  @Input({ required: true }) score!: string;
  @Input({ required: true }) otherPlayerScore!: string;
  @Input() disabled = false;
  @Output() scoreChange = new EventEmitter<string>();

  protected readonly String = String;
}
