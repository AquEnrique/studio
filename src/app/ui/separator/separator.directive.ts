import { Directive, HostBinding, Input } from '@angular/core';

@Directive({ selector: 'div[appSeparator]', standalone: true })
export class SeparatorDirective {
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';

  @HostBinding('attr.role') readonly role = 'separator';

  @HostBinding('attr.aria-orientation') get ariaOrientation(): string {
    return this.orientation;
  }

  @HostBinding('class') get hostClass(): string {
    return this.orientation === 'horizontal' ? 'shrink-0 bg-border h-[1px] w-full' : 'shrink-0 bg-border h-full w-[1px]';
  }
}
