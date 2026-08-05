'use client';

import { useCallback, useEffect, useState } from 'react';

export type PlayerKey = 'player1' | 'player2';

const STORAGE_KEY = 'fortaleza:life-points';
const DEFAULT_LP = 8000;

type LifePointsState = Record<PlayerKey, number>;

const DEFAULT_STATE: LifePointsState = { player1: DEFAULT_LP, player2: DEFAULT_LP };

function readStoredState(): LifePointsState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.player1 === 'number' && typeof parsed?.player2 === 'number') {
      return { player1: parsed.player1, player2: parsed.player2 };
    }
  } catch (error) {
    console.error('Failed to read life points from storage:', error);
  }
  return DEFAULT_STATE;
}

/**
 * Persists both players' life points to localStorage so the counter survives
 * navigating away to another route (or reloading the page) and picks up
 * exactly where it was left.
 */
export function useLifePoints() {
  const [state, setState] = useState<LifePointsState>(DEFAULT_STATE);
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
      console.error('Failed to save life points to storage:', error);
    }
  }, [state, hydrated]);

  // Keeps multiple open tabs/views of the counter in sync with each other.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setState(readStoredState());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const adjust = useCallback((player: PlayerKey, delta: number) => {
    setState((prev) => ({ ...prev, [player]: Math.max(0, prev[player] + delta) }));
  }, []);

  const setValue = useCallback((player: PlayerKey, value: number) => {
    setState((prev) => ({ ...prev, [player]: Math.max(0, Math.round(value)) }));
  }, []);

  const resetPlayer = useCallback((player: PlayerKey) => {
    setState((prev) => ({ ...prev, [player]: DEFAULT_LP }));
  }, []);

  const resetAll = useCallback(() => {
    setState({ ...DEFAULT_STATE });
  }, []);

  return {
    player1: state.player1,
    player2: state.player2,
    adjust,
    setValue,
    resetPlayer,
    resetAll,
    hydrated,
  };
}
