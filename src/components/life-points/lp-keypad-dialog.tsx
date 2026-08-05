
'use client';

import { useEffect, useState } from 'react';
import { Delete, Minus, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const DIGIT_ROWS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
] as const;

const MAX_DIGITS = 6;

type Accent = 'primary' | 'accent';

/**
 * Near-fullscreen on-screen keypad for entering a custom amount and applying
 * it to a player's life points as either a gain (+) or a loss (-), without
 * relying on the device's native keyboard.
 */
export function LpKeypadDialog({
  open,
  onOpenChange,
  label,
  currentValue,
  accent,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  currentValue: number;
  accent: Accent;
  onApply: (delta: number) => void;
}) {
  const [staged, setStaged] = useState('0');

  // Start each opening from a clean slate.
  useEffect(() => {
    if (open) setStaged('0');
  }, [open]);

  const stagedValue = parseInt(staged, 10) || 0;

  const pushDigit = (digit: string) => {
    setStaged((prev) => {
      const next = prev === '0' ? digit : prev + digit;
      return next.length > MAX_DIGITS ? prev : next;
    });
  };

  const backspace = () => setStaged((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
  const clear = () => setStaged('0');

  // Applying an operation always closes the calculator so the updated
  // total is immediately visible on the player panel.
  const apply = (sign: 1 | -1) => {
    if (stagedValue === 0) return;
    onApply(stagedValue * sign);
    onOpenChange(false);
  };

  const applyDirect = (delta: number) => {
    if (delta === 0) return;
    onApply(delta);
    onOpenChange(false);
  };

  // Doubles the current total.
  const applyDouble = () => applyDirect(currentValue);

  // Halving with a remainder always rounds the kept half up: e.g. 11 -> the
  // 5 (floor half) is subtracted, leaving 6 (ceil half).
  const applyHalve = () => applyDirect(-Math.floor(currentValue / 2));

  const accentText = accent === 'primary' ? 'text-primary' : 'text-accent';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92dvh] max-h-[760px] w-[94vw] max-w-md translate-x-[-50%] translate-y-[-50%] flex-col gap-3 overflow-hidden rounded-2xl p-4 sm:p-6">
        <DialogHeader className="shrink-0 text-left">
          <DialogTitle className={cn('flex items-baseline justify-between gap-2', accentText)}>
            <span>{label}</span>
            <span className="text-sm font-normal text-muted-foreground">Actual: {currentValue}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex shrink-0 items-center justify-between gap-2 rounded-xl bg-muted px-4 py-3">
          <span className="min-w-0 flex-1 truncate text-right text-4xl font-black tabular-nums sm:text-5xl">
            {staged}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={backspace}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              aria-label="Borrar último dígito"
            >
              <Delete className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={clear}
              className="flex h-10 items-center justify-center rounded-lg px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              aria-label="Limpiar"
            >
              C
            </button>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={applyDouble}
            className="flex h-11 items-center justify-center rounded-xl bg-muted text-lg font-bold transition-colors active:bg-muted-foreground/20 sm:h-12 sm:text-xl"
            aria-label={`Duplicar los puntos de vida de ${label}`}
          >
            ×2
          </button>
          <button
            type="button"
            onClick={applyHalve}
            className="flex h-11 items-center justify-center rounded-xl bg-muted text-lg font-bold transition-colors active:bg-muted-foreground/20 sm:h-12 sm:text-xl"
            aria-label={`Dividir entre 2 los puntos de vida de ${label}, redondeando hacia arriba`}
          >
            ÷2
          </button>
        </div>

        <div className="grid flex-1 grid-cols-3 grid-rows-4 gap-2 sm:gap-3">
          {DIGIT_ROWS.flat().map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => pushDigit(digit)}
              className="flex items-center justify-center rounded-xl bg-muted text-2xl font-bold transition-colors active:bg-muted-foreground/20 sm:text-3xl"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={() => apply(1)}
            className="flex items-center justify-center rounded-xl bg-success/15 text-success transition-colors active:bg-success/25"
            aria-label={`Sumar ${staged} a ${label}`}
          >
            <Plus className="h-8 w-8" />
          </button>
          <button
            type="button"
            onClick={() => pushDigit('0')}
            className="flex items-center justify-center rounded-xl bg-muted text-2xl font-bold transition-colors active:bg-muted-foreground/20 sm:text-3xl"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => apply(-1)}
            className="flex items-center justify-center rounded-xl bg-destructive/15 text-destructive transition-colors active:bg-destructive/25"
            aria-label={`Restar ${staged} a ${label}`}
          >
            <Minus className="h-8 w-8" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
