import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LocalStorageRecord } from '../lib/local-storage-record';

export type PieceKey = 'king' | 'knight';

const STORAGE_KEY = 'fortaleza:angelechy-counters';
const DEFAULT_VALUE = 0;

/**
 * Persists the king and knight counters to localStorage so they survive
 * navigating to another route (or reloading the page).
 */
@Injectable({ providedIn: 'root' })
export class AngelechyCountersService {
  private readonly record = new LocalStorageRecord<PieceKey>(
    STORAGE_KEY,
    { king: DEFAULT_VALUE, knight: DEFAULT_VALUE },
    isPlatformBrowser(inject(PLATFORM_ID))
  );

  readonly king = this.record.get('king');
  readonly knight = this.record.get('knight');
  readonly hydrated = this.record.hydrated;

  adjust(piece: PieceKey, delta: number): void {
    this.record.adjust(piece, delta);
  }

  resetPiece(piece: PieceKey): void {
    this.record.resetOne(piece);
  }

  resetAll(): void {
    this.record.resetAll();
  }
}
