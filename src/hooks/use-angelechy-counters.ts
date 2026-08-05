'use client';

import { useCallback, useEffect, useState } from 'react';

export type PieceKey = 'king' | 'knight';

const STORAGE_KEY = 'fortaleza:angelechy-counters';
const DEFAULT_VALUE = 0;

type CountersState = Record<PieceKey, number>;

const DEFAULT_STATE: CountersState = { king: DEFAULT_VALUE, knight: DEFAULT_VALUE };

function readStoredState(): CountersState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.king === 'number' && typeof parsed?.knight === 'number') {
      return { king: parsed.king, knight: parsed.knight };
    }
  } catch (error) {
    console.error('Failed to read Angelechy counters from storage:', error);
  }
  return DEFAULT_STATE;
}

/**
 * Persists the king and knight counters to localStorage so they survive
 * navigating to another route (or reloading the page).
 */
export function useAngelechyCounters() {
  const [state, setState] = useState<CountersState>(DEFAULT_STATE);
  // Avoids writing the default state back over a real stored value before
  // the initial read from localStorage has happened (client-only).
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readStoredState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save Angelechy counters to storage:', error);
    }
  }, [state, hydrated]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setState(readStoredState());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const adjust = useCallback((piece: PieceKey, delta: number) => {
    setState((prev) => ({ ...prev, [piece]: Math.max(0, prev[piece] + delta) }));
  }, []);

  const resetPiece = useCallback((piece: PieceKey) => {
    setState((prev) => ({ ...prev, [piece]: DEFAULT_VALUE }));
  }, []);

  const resetAll = useCallback(() => {
    setState({ ...DEFAULT_STATE });
  }, []);

  return {
    king: state.king,
    knight: state.knight,
    adjust,
    resetPiece,
    resetAll,
    hydrated,
  };
}
