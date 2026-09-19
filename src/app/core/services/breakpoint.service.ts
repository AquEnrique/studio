import { Injectable, OnDestroy, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const MOBILE_BREAKPOINT = 768;

@Injectable({ providedIn: 'root' })
export class BreakpointService implements OnDestroy {
  private readonly mql: MediaQueryList | undefined;
  private readonly listener = () => this.isMobile.set(this.mql!.matches);

  readonly isMobile = signal(false);

  constructor() {
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    if (!isBrowser) return;
    this.mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    this.isMobile.set(this.mql.matches);
    this.mql.addEventListener('change', this.listener);
  }

  ngOnDestroy(): void {
    this.mql?.removeEventListener('change', this.listener);
  }
}
