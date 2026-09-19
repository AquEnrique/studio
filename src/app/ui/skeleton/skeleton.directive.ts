import { Directive, HostBinding } from '@angular/core';

@Directive({ selector: 'div[appSkeleton]', standalone: true })
export class SkeletonDirective {
  @HostBinding('class') readonly hostClass = 'animate-pulse rounded-md bg-muted';
}
