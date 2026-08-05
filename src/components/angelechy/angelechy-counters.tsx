
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Heart, Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAngelechyCounters } from '@/hooks/use-angelechy-counters';

export function AngelechyCounters() {
  const { king, knight, adjust, resetPiece, resetAll, hydrated } = useAngelechyCounters();

  return (
    <main
      className={cn(
        'flex min-h-0 flex-1 flex-col items-center gap-4 p-3 transition-opacity duration-200 sm:gap-6 sm:p-4',
        !hydrated && 'opacity-0'
      )}
    >
      <div className="flex w-full max-w-xl flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold sm:text-xl">Angelechy</h1>
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/life-points">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Puntos de Vida</span>
            </Link>
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={resetAll} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">Reiniciar todo</span>
        </Button>
      </div>

      <div className="flex w-full max-w-xl flex-1 items-stretch justify-center">
        <div className="flex w-full divide-x-2 divide-border overflow-hidden rounded-xl border-2 border-border">
          <PieceCounter
            symbol="♔"
            label="Rey"
            value={king}
            onAdjust={(delta) => adjust('king', delta)}
            onReset={() => resetPiece('king')}
          />
          <PieceCounter
            symbol="♘"
            label="Caballo"
            value={knight}
            onAdjust={(delta) => adjust('knight', delta)}
            onReset={() => resetPiece('knight')}
          />
        </div>
      </div>
    </main>
  );
}

function PieceCounter({
  symbol,
  label,
  value,
  onAdjust,
  onReset,
}: {
  symbol: string;
  label: string;
  value: number;
  onAdjust: (delta: number) => void;
  onReset: () => void;
}) {
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

  // Tap applies one step immediately; holding repeats it for fast counting.
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

  return (
    <div className="flex flex-1 basis-0 flex-col items-center gap-2 bg-card p-3 sm:gap-3 sm:p-4">
      <div className="flex w-full items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground sm:text-base">{label}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onReset}
          aria-label={`Reiniciar ${label} a 0`}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <button
        type="button"
        onPointerDown={() => startHold(1)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        className="flex h-14 w-full items-center justify-center rounded-lg bg-success/15 text-success transition-colors active:bg-success/25 sm:h-16 [@media(orientation:landscape)]:h-12"
        aria-label={`Sumar 1 a ${label}`}
      >
        <Plus className="h-7 w-7" />
      </button>

      <div className="relative flex flex-1 items-center justify-center gap-2 py-2">
        {flash && (
          <span
            key={flash.id}
            className={cn(
              'pointer-events-none absolute -top-1 animate-in fade-in slide-in-from-bottom-2 text-base font-bold duration-300 sm:text-xl',
              flash.text.startsWith('+') ? 'text-success' : 'text-destructive'
            )}
          >
            {flash.text}
          </span>
        )}
        <span className="select-none text-5xl leading-none sm:text-6xl [@media(orientation:landscape)]:text-4xl" aria-hidden>
          {symbol}
        </span>
        <span className="select-none text-5xl font-black tabular-nums leading-none sm:text-6xl [@media(orientation:landscape)]:text-4xl">
          {value}
        </span>
      </div>

      <button
        type="button"
        onPointerDown={() => startHold(-1)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
        className="flex h-14 w-full items-center justify-center rounded-lg bg-destructive/15 text-destructive transition-colors active:bg-destructive/25 sm:h-16 [@media(orientation:landscape)]:h-12"
        aria-label={`Restar 1 a ${label}`}
      >
        <Minus className="h-7 w-7" />
      </button>
    </div>
  );
}
