import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LocalStorageRecord } from '../lib/local-storage-record';

export type PlayerKey = 'player1' | 'player2';

const STORAGE_KEY = 'fortaleza:life-points';
const DEFAULT_LP = 8000;

/**
 * Persists both players' life points to localStorage so the counter survives
 * navigating away to another route (or reloading the page) and picks up
 * exactly where it was left.
 */
@Injectable({ providedIn: 'root' })
export class LifePointsService {
  private readonly record = new LocalStorageRecord<PlayerKey>(
    STORAGE_KEY,
    { player1: DEFAULT_LP, player2: DEFAULT_LP },
    isPlatformBrowser(inject(PLATFORM_ID))
  );

  readonly player1 = this.record.get('player1');
  readonly player2 = this.record.get('player2');
  readonly hydrated = this.record.hydrated;

  adjust(player: PlayerKey, delta: number): void {
    this.record.adjust(player, delta);
  }

  setValue(player: PlayerKey, value: number): void {
    this.record.setValue(player, value);
  }

  resetPlayer(player: PlayerKey): void {
    this.record.resetOne(player);
  }

  resetAll(): void {
    this.record.resetAll();
  }
}
