'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const CLOCK_NPOINT_URL = 'https://api.npoint.io/37831bbb7b302ff650e8';
const ROUND_DURATION = 50 * 60 * 1000; // 50 minutes in milliseconds

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

  useEffect(() => {
    fetchStartTime();
    const interval = setInterval(fetchStartTime, 120000); // Poll every 2 minutes
    return () => clearInterval(interval);
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
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Round Time Finished!', {
            body: 'The 50-minute round timer has ended.',
            icon: '/favicon.ico',
          });
        }
      } else {
        setRemainingTime(newRemainingTime);
        setIsFinished(false);
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
