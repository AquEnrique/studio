import { Directive, HostBinding, Input } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';

// Shared variant recipe (ported from the previous shadcn/Radix button). Any UI
// primitive with variants/sizes in this app follows the same cva + directive pattern.
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10 shrink-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;

// Applied directly to a native <button>/<a> instead of wrapping it in a component,
// so it composes with the element's own attributes/events with no extra DOM node.
@Directive({
  selector: 'button[appButton], a[appButton]',
  standalone: true,
})
export class ButtonDirective {
  @Input() variant: ButtonVariant = 'default';
  @Input() size: ButtonSize = 'default';

  @HostBinding('class') get hostClass(): string {
    return buttonVariants({ variant: this.variant, size: this.size });
  }
}
