'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

const CLOCK_NPOINT_URL = 'https://api.npoint.io/37831bbb7b302ff650e8';
const ROUND_DURATION = 50 * 60 * 1000; // 50 minutes in milliseconds
const FIVE_MINUTE_WARNING = 5 * 60 * 1000;

// `vibrate` is part of the Notifications API spec (used on Android) but is
// missing from TypeScript's bundled NotificationOptions type.
type NotifyOptions = NotificationOptions & { vibrate?: number | number[] };

// Local notifications must go through a Service Worker registration on mobile —
// the bare `new Notification()` constructor is desktop-only and silently
// fails (or throws) on Android/iOS browsers.
const notify = async (title: string, options?: NotifyOptions) => {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, { icon: '/favicon.ico', ...options } as NotificationOptions);
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
};

interface ClockState {
  startTime: number | null;
  remainingTime: number;
  isFinished: boolean;
  startRoundTimer: () => Promise<void>;
  resetRoundTimer: () => Promise<void>;
  requestNotificationPermission: () => void;
  refreshClock: () => void;
}

const ClockContext = createContext<ClockState | undefined>(undefined);

export function ClockProvider({ children }: { children: ReactNode }) {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState(ROUND_DURATION);
  const [isFinished, setIsFinished] = useState(false);
  // Track which startTime each one-shot notification has already fired for,
  // so it fires exactly once per round timer instead of on every tick.
  const fiveMinWarningSentFor = useRef<number | null>(null);
  const finishedNotificationSentFor = useRef<number | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service worker registration failed:', error);
      });
    }
  }, []);

  const fetchStartTime = useCallback(async () => {
    try {
      const response = await fetch(CLOCK_NPOINT_URL, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (data && data.startTime) {
          setStartTime(data.startTime);
        } else {
          setStartTime(null);
          setRemainingTime(ROUND_DURATION);
          setIsFinished(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch clock start time:", error);
    }
  }, []);

  const refreshClock = useCallback(() => {
    fetchStartTime();
  }, [fetchStartTime]);

  const updateNpoint = async (time: number | null) => {
    try {
      await fetch(CLOCK_NPOINT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime: time }),
      });
    } catch (error) {
      console.error("Failed to update clock on npoint.io:", error);
    }
  };

  const startRoundTimer = async () => {
    const now = Date.now();
    setStartTime(now);
    setIsFinished(false);
    await updateNpoint(now);
  };

  const resetRoundTimer = async () => {
    setStartTime(null);
    setRemainingTime(ROUND_DURATION);
    setIsFinished(false);
    fiveMinWarningSentFor.current = null;
    finishedNotificationSentFor.current = null;
    await updateNpoint(null);
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  useEffect(() => {
    if (!startTime) {
      setRemainingTime(ROUND_DURATION);
      setIsFinished(false);
      return;
    }

    const interval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const newRemainingTime = ROUND_DURATION - elapsedTime;

      if (newRemainingTime <= 0) {
        setRemainingTime(0);
        setIsFinished(true);
        clearInterval(interval);

        if (finishedNotificationSentFor.current !== startTime) {
          finishedNotificationSentFor.current = startTime;
          notify('¡Tiempo terminado!', {
            body: 'La ronda de 50 minutos ha finalizado.',
            tag: 'ygo-round-finished',
            requireInteraction: true,
            vibrate: [200, 100, 200],
          });
        }
      } else {
        setRemainingTime(newRemainingTime);
        setIsFinished(false);

        if (newRemainingTime <= FIVE_MINUTE_WARNING && fiveMinWarningSentFor.current !== startTime) {
          fiveMinWarningSentFor.current = startTime;
          notify('Quedan 5 minutos', {
            body: 'La ronda está por terminar.',
            tag: 'ygo-round-5min',
            vibrate: [150],
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);
  
  const value = {
    startTime,
    remainingTime,
    isFinished,
    startRoundTimer,
    resetRoundTimer,
    requestNotificationPermission,
    refreshClock,
  };

  return (
    <ClockContext.Provider value={value}>
      {children}
    </ClockContext.Provider>
  );
}

export const useClock = (): ClockState => {
  const context = useContext(ClockContext);
  if (context === undefined) {
    throw new Error('useClock must be used within a ClockProvider');
  }
  return context;
};
