import { Directive, HostBinding, Input } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';

export const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'border-destructive/50 text-destructive [&>svg]:text-destructive',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export type AlertVariant = NonNullable<VariantProps<typeof alertVariants>['variant']>;

@Directive({ selector: 'div[appAlert]', standalone: true })
export class AlertDirective {
  @Input() variant: AlertVariant = 'default';

  @HostBinding('attr.role') readonly role = 'alert';

  @HostBinding('class') get hostClass(): string {
    return alertVariants({ variant: this.variant });
  }
}

@Directive({ selector: 'h5[appAlertTitle]', standalone: true })
export class AlertTitleDirective {
  @HostBinding('class') readonly hostClass = 'mb-1 font-medium leading-none tracking-tight';
}

@Directive({ selector: 'div[appAlertDescription]', standalone: true })
export class AlertDescriptionDirective {
  @HostBinding('class') readonly hostClass = 'text-sm [&_p]:leading-relaxed';
}
