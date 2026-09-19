import { Directive, HostBinding } from '@angular/core';

@Directive({ selector: 'div[appCard]', standalone: true })
export class CardDirective {
  @HostBinding('class') readonly hostClass = 'rounded-lg border bg-card text-card-foreground shadow-sm';
}

@Directive({ selector: 'div[appCardHeader]', standalone: true })
export class CardHeaderDirective {
  @HostBinding('class') readonly hostClass = 'flex flex-col space-y-1.5 p-4 md:p-6';
}

@Directive({ selector: 'div[appCardTitle]', standalone: true })
export class CardTitleDirective {
  @HostBinding('class') readonly hostClass = 'text-xl font-semibold leading-none tracking-tight md:text-2xl';
}

@Directive({ selector: 'div[appCardDescription]', standalone: true })
export class CardDescriptionDirective {
  @HostBinding('class') readonly hostClass = 'text-sm text-muted-foreground';
}

@Directive({ selector: 'div[appCardContent]', standalone: true })
export class CardContentDirective {
  @HostBinding('class') readonly hostClass = 'p-4 pt-0 md:p-6 md:pt-0';
}

@Directive({ selector: 'div[appCardFooter]', standalone: true })
export class CardFooterDirective {
  @HostBinding('class') readonly hostClass = 'flex items-center p-4 pt-0 md:p-6 md:pt-0';
}
