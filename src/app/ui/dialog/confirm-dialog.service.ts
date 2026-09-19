import { Component, Injectable, inject } from '@angular/core';
import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { ButtonDirective, ButtonVariant } from '../button/button.directive';
import { DialogDescriptionDirective, DialogFooterDirective, DialogHeaderDirective, DialogTitleDirective } from './dialog-parts';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

export interface InfoOptions {
  title: string;
  description?: string;
  closeLabel?: string;
}

// Internal data shape the shared component actually renders from.
interface ConfirmDialogData {
  title: string;
  description?: string;
  mode: 'confirm' | 'info';
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant: ButtonVariant;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ButtonDirective, DialogHeaderDirective, DialogFooterDirective, DialogTitleDirective, DialogDescriptionDirective],
  template: `
    <div appDialogHeader>
      <h2 appDialogTitle>{{ data.title }}</h2>
      @if (data.description) {
        <div appDialogDescription>{{ data.description }}</div>
      }
    </div>
    <div appDialogFooter>
      @if (data.mode === 'confirm') {
        <button appButton variant="outline" class="mt-2 sm:mt-0" (click)="dialogRef.close(false)">{{ data.cancelLabel }}</button>
        <button appButton [variant]="data.confirmVariant" (click)="dialogRef.close(true)">{{ data.confirmLabel }}</button>
      } @else {
        <button appButton variant="outline" (click)="dialogRef.close(true)">{{ data.confirmLabel }}</button>
      }
    </div>
  `,
})
export class ConfirmDialogComponent {
  protected readonly data = inject<ConfirmDialogData>(DIALOG_DATA);
  protected readonly dialogRef = inject<DialogRef<boolean, ConfirmDialogComponent>>(DialogRef);
}

/**
 * Shared confirm/info modal for the app's few AlertDialog-style prompts (reset,
 * rollback, import-overwrite confirmations, and the standings table's OTP/GW%/OGW%
 * explanations, which only ever showed a single "Cerrar" button).
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly dialog = inject(Dialog);

  confirm(options: ConfirmOptions): Promise<boolean> {
    return this.open({
      title: options.title,
      description: options.description,
      mode: 'confirm',
      confirmLabel: options.confirmLabel ?? 'Confirmar',
      cancelLabel: options.cancelLabel ?? 'Cancelar',
      confirmVariant: options.variant === 'destructive' ? 'destructive' : 'default',
    });
  }

  async info(options: InfoOptions): Promise<void> {
    await this.open({
      title: options.title,
      description: options.description,
      mode: 'info',
      confirmLabel: options.closeLabel ?? 'Cerrar',
      confirmVariant: 'outline',
    });
  }

  private open(data: ConfirmDialogData): Promise<boolean> {
    const ref = this.dialog.open<boolean, ConfirmDialogData>(ConfirmDialogComponent, {
      data,
      panelClass: ['app-dialog-panel'],
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-dark-backdrop',
    });
    return firstValueFrom(ref.closed).then((result) => !!result);
  }
}
