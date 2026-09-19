import { Injectable, signal } from '@angular/core';

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY_MS = 4000;

export type ToastVariant = 'default' | 'destructive' | 'success';

export interface ToasterToast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

export type ToastInput = Omit<ToasterToast, 'id'>;

let count = 0;
function genId(): string {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToasterToast[]>([]);
  private readonly timeouts = new Map<string, ReturnType<typeof setTimeout>>();

  toast(input: ToastInput): { id: string; dismiss: () => void } {
    const id = genId();
    this.toasts.update((toasts) => [{ ...input, id }, ...toasts].slice(0, TOAST_LIMIT));

    const handle = setTimeout(() => this.dismiss(id), TOAST_REMOVE_DELAY_MS);
    this.timeouts.set(id, handle);

    return { id, dismiss: () => this.dismiss(id) };
  }

  dismiss(toastId?: string): void {
    if (toastId) {
      clearTimeout(this.timeouts.get(toastId));
      this.timeouts.delete(toastId);
      this.toasts.update((toasts) => toasts.filter((t) => t.id !== toastId));
    } else {
      this.toasts().forEach((t) => clearTimeout(this.timeouts.get(t.id)));
      this.timeouts.clear();
      this.toasts.set([]);
    }
  }
}
