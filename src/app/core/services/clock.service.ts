import { Injectable, OnDestroy, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const CLOCK_URL = 'https://fortaleza-tcg-default-rtdb.firebaseio.com/reloj.json';
const ROUND_DURATION = 50 * 60 * 1000; // 50 minutes in milliseconds
const FIVE_MINUTE_WARNING = 5 * 60 * 1000;

// `vibrate` is part of the Notifications API spec (used on Android) but is
// missing from TypeScript's bundled NotificationOptions type.
type NotifyOptions = NotificationOptions & { vibrate?: number | number[] };

// Local notifications must go through a Service Worker registration on mobile —
// the bare `new Notification()` constructor is desktop-only and silently
// fails (or throws) on Android/iOS browsers.
async function notify(title: string, options?: NotifyOptions): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, { icon: 'favicon.ico', ...options } as NotificationOptions);
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}

@Injectable({ providedIn: 'root' })
export class ClockService implements OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly startTime = signal<number | null>(null);
  readonly remainingTime = signal(ROUND_DURATION);
  readonly isFinished = signal(false);

  // Track which startTime each one-shot notification has already fired for,
  // so it fires exactly once per round timer instead of on every tick.
  private fiveMinWarningSentFor: number | null = null;
  private finishedNotificationSentFor: number | null = null;
  private tickHandle: ReturnType<typeof setInterval> | undefined;

  constructor() {
    if (!this.isBrowser) return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch((error) => {
        console.error('Service worker registration failed:', error);
      });
    }

    this.fetchStartTime();
    // Live updates from Firebase so every device sees the judge start/reset the round timer.
    new EventSource(CLOCK_URL).addEventListener('put', (event) => {
      const { path, data } = JSON.parse((event as MessageEvent).data);
      if (path === '/') this.applyRemote(data);
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.tickHandle);
  }

  private async fetchStartTime(): Promise<void> {
    if (!this.isBrowser) return;
    try {
      const response = await fetch(CLOCK_URL, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
      if (response.ok) this.applyRemote(await response.json());
    } catch (error) {
      console.error('Failed to fetch clock start time:', error);
    }
  }

  private applyRemote(data: { startTime?: number | null } | null): void {
    const startTime = data?.startTime || null;
    if (startTime !== this.startTime()) this.setStartTime(startTime);
  }

  refreshClock(): void {
    this.fetchStartTime();
  }

  private async updateRemote(time: number | null): Promise<void> {
    try {
      await fetch(CLOCK_URL, {
        method: 'PUT',
        signal: AbortSignal.timeout(10000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime: time }),
      });
    } catch (error) {
      console.error('Failed to update clock on Firebase:', error);
    }
  }

  async startRoundTimer(): Promise<void> {
    const now = Date.now();
    this.setStartTime(now);
    this.isFinished.set(false);
    await this.updateRemote(now);
  }

  async resetRoundTimer(): Promise<void> {
    this.setStartTime(null);
    this.remainingTime.set(ROUND_DURATION);
    this.isFinished.set(false);
    this.fiveMinWarningSentFor = null;
    this.finishedNotificationSentFor = null;
    await this.updateRemote(null);
  }

  requestNotificationPermission(): void {
    if (this.isBrowser && 'Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }

  // Restarts the 1s countdown interval whenever startTime changes, mirroring the
  // original effect keyed on `startTime`.
  private setStartTime(startTime: number | null): void {
    this.startTime.set(startTime);
    clearInterval(this.tickHandle);

    if (!startTime) {
      this.remainingTime.set(ROUND_DURATION);
      this.isFinished.set(false);
      return;
    }

    const tick = () => {
      const elapsedTime = Date.now() - startTime;
      const newRemainingTime = ROUND_DURATION - elapsedTime;

      if (newRemainingTime <= 0) {
        this.remainingTime.set(0);
        this.isFinished.set(true);
        clearInterval(this.tickHandle);

        if (this.finishedNotificationSentFor !== startTime) {
          this.finishedNotificationSentFor = startTime;
          notify('¡Tiempo terminado!', {
            body: 'La ronda de 50 minutos ha finalizado.',
            tag: 'ygo-round-finished',
            requireInteraction: true,
            vibrate: [200, 100, 200],
          });
        }
      } else {
        this.remainingTime.set(newRemainingTime);
        this.isFinished.set(false);

        if (newRemainingTime <= FIVE_MINUTE_WARNING && this.fiveMinWarningSentFor !== startTime) {
          this.fiveMinWarningSentFor = startTime;
          notify('Quedan 5 minutos', {
            body: 'La ronda está por terminar.',
            tag: 'ygo-round-5min',
            vibrate: [150],
          });
        }
      }
    };

    tick();
    this.tickHandle = setInterval(tick, 1000);
  }
}
