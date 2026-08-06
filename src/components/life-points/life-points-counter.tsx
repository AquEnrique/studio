
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Crown, Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLifePoints } from '@/hooks/use-life-points';
import { LpKeypadDialog } from '@/components/life-points/lp-keypad-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const STEP_OPTIONS = [100, 500, 1000] as const;

export function LifePointsCounter() {
  const { player1, player2, adjust, resetAll, hydrated } = useLifePoints();
  const [step, setStep] = useState<number>(100);

  return (
    <main
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-3 p-3 transition-opacity duration-200 sm:p-4',
        !hydrated && 'opacity-0'
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold sm:text-xl">Puntos de Vida</h1>
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/angelechy">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Angelechy</span>
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-muted p-1">
            {STEP_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStep(option)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold transition-colors sm:text-sm',
                  step === option
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {option}
              </button>
            ))}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Reiniciar</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Reiniciar puntos de vida?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esto pondrá los puntos de vida de ambos jugadores de nuevo en 8000. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={resetAll}>Reiniciar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 [@media(orientation:landscape)]:flex-row">
        <PlayerPanel
          label="Jugador 1"
          value={player1}
          step={step}
          accent="primary"
          onAdjust={(delta) => adjust('player1', delta)}
        />
        <PlayerPanel
          label="Jugador 2"
          value={player2}
          step={step}
          accent="accent"
          onAdjust={(delta) => adjust('player2', delta)}
        />
      </div>
    </main>
  );
}

type Accent = 'primary' | 'accent';

function PlayerPanel({
  label,
  value,
  step,
  accent,
  onAdjust,
}: {
  label: string;
  value: number;
  step: number;
  accent: Accent;
  onAdjust: (delta: number) => void;
}) {
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [flash, setFlash] = useState<{ id: number; text: string } | null>(null);
  const flashTimeout = useRef<ReturnType<typeof setTimeout>>();
  const holdTimeout = useRef<ReturnType<typeof setTimeout>>();
  const holdInterval = useRef<ReturnType<typeof setInterval>>();

  const showFlash = useCallback((delta: number) => {
    if (flashTimeout.current) clearTimeout(flashTimeout.current);
    setFlash({ id: Date.now(), text: `${delta > 0 ? '+' : ''}${delta}` });
    flashTimeout.current = setTimeout(() => setFlash(null), 900);
  }, []);

  const handleAdjust = useCallback(
    (delta: number) => {
      onAdjust(delta);
      showFlash(delta);
    },
    [onAdjust, showFlash]
  );

  const stopHold = useCallback(() => {
    if (holdTimeout.current) clearTimeout(holdTimeout.current);
    if (holdInterval.current) clearInterval(holdInterval.current);
  }, []);

  // Tap applies one step immediately; holding repeats it so big swings
  // (e.g. reaching 0 from 8000) don't take dozens of individual taps.
  const startHold = useCallback(
    (delta: number) => {
      handleAdjust(delta);
      holdTimeout.current = setTimeout(() => {
        holdInterval.current = setInterval(() => handleAdjust(delta), 150);
      }, 450);
    },
    [handleAdjust]
  );

  useEffect(() => stopHold, [stopHold]);

  const accentClasses =
    accent === 'primary' ? 'border-primary/30 bg-primary/5' : 'border-accent/30 bg-accent/5';

  return (
    <div
      className={cn(
        'relative flex flex-1 basis-0 flex-col items-center justify-between overflow-hidden rounded-xl border-2 p-3 sm:p-4',
        accentClasses
      )}
    >
      <div className="flex w-full items-center justify-center">
        <span className="text-sm font-semibold text-muted-foreground sm:text-base">{label}</span>
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        {flash && (
          <span
            key={flash.id}
            className={cn(
              'pointer-events-none absolute -top-1 animate-in fade-in slide-in-from-bottom-2 text-lg font-bold duration-300 sm:text-2xl',
              flash.text.startsWith('+') ? 'text-success' : 'text-destructive'
            )}
          >
            {flash.text}
          </span>
        )}
        <button
          type="button"
          onClick={() => setKeypadOpen(true)}
          className="select-none text-center text-6xl font-black tabular-nums tracking-tighter transition-transform active:scale-95 sm:text-7xl [@media(orientation:landscape)]:text-5xl"
          aria-label={`${label}: ${value} puntos de vida. Tocar para abrir el teclado numérico.`}
        >
          {value}
        </button>
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        <button
          type="button"
          onPointerDown={() => startHold(-step)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          className="flex h-16 items-center justify-center gap-2 rounded-lg bg-destructive/15 text-destructive transition-colors active:bg-destructive/25 sm:h-20 [@media(orientation:landscape)]:h-14"
          aria-label={`Restar ${step} a ${label}`}
        >
          <Minus className="h-6 w-6" />
          <span className="text-lg font-bold sm:text-xl">{step}</span>
        </button>
        <button
          type="button"
          onPointerDown={() => startHold(step)}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          className="flex h-16 items-center justify-center gap-2 rounded-lg bg-success/15 text-success transition-colors active:bg-success/25 sm:h-20 [@media(orientation:landscape)]:h-14"
          aria-label={`Sumar ${step} a ${label}`}
        >
          <Plus className="h-6 w-6" />
          <span className="text-lg font-bold sm:text-xl">{step}</span>
        </button>
      </div>

      <LpKeypadDialog
        open={keypadOpen}
        onOpenChange={setKeypadOpen}
        label={label}
        currentValue={value}
        accent={accent}
        onApply={handleAdjust}
      />
    </div>
  );
}
