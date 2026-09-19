import { Component, inject } from '@angular/core';
import { cva } from 'class-variance-authority';
import { LucideIcons } from '../../core/icons';
import { ToastService } from '../../core/services/toast.service';

// Ported from toastVariants in the old toast.tsx. Radix's swipe-to-dismiss gesture
// and the `ToastAction` custom-action-button slot are dropped: no call site in the
// old app (`toast({...})` under src/components/tournament/tournament-controls.tsx)
// ever passed a custom action, only title/description/variant.
const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all sm:p-6',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive: 'border-destructive bg-destructive text-destructive-foreground',
        // Not present in the old app; added since ToastService's variant type
        // includes it. Visually: default surface, success-tinted border/text.
        success: 'border-success/50 bg-background text-success',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

@Component({
  selector: 'app-toaster',
  standalone: true,
  imports: [LucideIcons],
  template: `
    <div class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      @for (t of toastService.toasts(); track t.id) {
        <div [class]="toastVariants({ variant: t.variant ?? 'default' })">
          <div class="grid gap-1">
            @if (t.title) {
              <p class="text-sm font-semibold">{{ t.title }}</p>
            }
            @if (t.description) {
              <p class="text-sm opacity-90">{{ t.description }}</p>
            }
          </div>
          <button
            type="button"
            class="absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Cerrar notificación"
            (click)="toastService.dismiss(t.id)"
          >
            <lucide-icon name="X" [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToasterComponent {
  protected readonly toastService = inject(ToastService);
  protected readonly toastVariants = toastVariants;
}
