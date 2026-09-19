import { Component, Input, inject, signal } from '@angular/core';
import { LucideIcons } from '../../core/icons';

@Component({
  selector: 'app-accordion-item',
  standalone: true,
  template: `<ng-content />`,
  host: { class: 'border-b' },
})
export class AccordionItemComponent {
  readonly open = signal(false);
}

@Component({
  selector: 'app-accordion-trigger',
  standalone: true,
  imports: [LucideIcons],
  template: `
    <div class="flex">
      <button
        type="button"
        class="flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline"
        [class]="triggerClass"
        (click)="item.open.set(!item.open())"
        [attr.aria-expanded]="item.open()"
      >
        <ng-content />
        <lucide-icon name="ChevronDown" [size]="16" class="shrink-0 transition-transform duration-200" [class.rotate-180]="item.open()" />
      </button>
    </div>
  `,
})
export class AccordionTriggerComponent {
  readonly item = inject(AccordionItemComponent);
  // Extra classes merged onto the inner <button> (can't use a plain `class` input
  // alias - Angular reserves that name's binding semantics for the host element).
  @Input() triggerClass = '';
}

@Component({
  selector: 'app-accordion-content',
  standalone: true,
  template: `
    <div class="grid overflow-hidden text-sm transition-[grid-template-rows] duration-200 ease-out" [style.grid-template-rows]="item.open() ? '1fr' : '0fr'">
      <div class="min-h-0 overflow-hidden">
        <div class="pb-4 pt-0">
          <ng-content />
        </div>
      </div>
    </div>
  `,
})
export class AccordionContentComponent {
  readonly item = inject(AccordionItemComponent);
}
