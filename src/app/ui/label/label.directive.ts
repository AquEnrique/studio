import { Directive, HostBinding } from '@angular/core';

@Directive({ selector: 'label[appLabel]', standalone: true })
export class LabelDirective {
  @HostBinding('class') readonly hostClass = 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70';
}
