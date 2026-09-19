import { Signal, WritableSignal, computed, signal } from '@angular/core';

// Shared plumbing behind LifePointsService/AngelechyCountersService: a small numeric
// record persisted to localStorage, kept in sync across tabs via the `storage` event.
export class LocalStorageRecord<K extends string> {
  private readonly state: WritableSignal<Record<K, number>>;
  readonly hydrated = signal(false);

  constructor(
    private readonly storageKey: string,
    private readonly defaults: Record<K, number>,
    private readonly isBrowser: boolean
  ) {
    this.state = signal({ ...defaults });
    if (this.isBrowser) {
      this.state.set(this.readStored());
      this.hydrated.set(true);
      window.addEventListener('storage', (event) => {
        if (event.key !== this.storageKey) return;
        this.state.set(this.readStored());
      });
    }
  }

  get(key: K): Signal<number> {
    return computed(() => this.state()[key]);
  }

  private readStored(): Record<K, number> {
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return { ...this.defaults };
      const parsed = JSON.parse(raw);
      const result = { ...this.defaults };
      for (const key of Object.keys(this.defaults) as K[]) {
        if (typeof parsed?.[key] === 'number') result[key] = parsed[key];
      }
      return result;
    } catch (error) {
      console.error(`Failed to read ${this.storageKey} from storage:`, error);
      return { ...this.defaults };
    }
  }

  private persist(next: Record<K, number>): void {
    if (!this.isBrowser || !this.hydrated()) return;
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(next));
    } catch (error) {
      console.error(`Failed to save ${this.storageKey} to storage:`, error);
    }
  }

  adjust(key: K, delta: number): void {
    this.update((prev) => ({ ...prev, [key]: Math.max(0, prev[key] + delta) }));
  }

  setValue(key: K, value: number): void {
    this.update((prev) => ({ ...prev, [key]: Math.max(0, Math.round(value)) }));
  }

  resetOne(key: K): void {
    this.update((prev) => ({ ...prev, [key]: this.defaults[key] }));
  }

  resetAll(): void {
    this.update(() => ({ ...this.defaults }));
  }

  private update(fn: (prev: Record<K, number>) => Record<K, number>): void {
    const next = fn(this.state());
    this.state.set(next);
    this.persist(next);
  }
}
