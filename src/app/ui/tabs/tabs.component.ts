import { Component, Input, inject, model } from '@angular/core';

@Component({
  selector: 'app-tabs',
  standalone: true,
  template: `<ng-content />`,
})
export class TabsComponent {
  readonly value = model<string>('');
}

@Component({
  selector: 'app-tabs-list',
  standalone: true,
  template: `<ng-content />`,
  host: {
    role: 'tablist',
    class: 'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
  },
})
export class TabsListComponent {}

@Component({
  selector: 'app-tabs-trigger',
  standalone: true,
  template: `
    <button
      type="button"
      role="tab"
      [attr.aria-selected]="isActive()"
      [class.bg-background]="isActive()"
      [class.text-foreground]="isActive()"
      [class.shadow-sm]="isActive()"
      class="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
      (click)="select()"
    >
      <ng-content />
    </button>
  `,
})
export class TabsTriggerComponent {
  private readonly tabs = inject(TabsComponent);
  @Input() value!: string;

  isActive(): boolean {
    return this.tabs.value() === this.value;
  }

  select(): void {
    this.tabs.value.set(this.value);
  }
}

@Component({
  selector: 'app-tabs-content',
  standalone: true,
  template: `
    @if (isActive()) {
      <div class="mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <ng-content />
      </div>
    }
  `,
})
export class TabsContentComponent {
  private readonly tabs = inject(TabsComponent);
  @Input() value!: string;

  isActive(): boolean {
    return this.tabs.value() === this.value;
  }
}
