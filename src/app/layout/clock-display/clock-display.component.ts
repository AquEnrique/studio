import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ClockService } from '../../core/services/clock.service';
import { TournamentService } from '../../core/services/tournament.service';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

@Component({
  selector: 'app-clock-display',
  standalone: true,
  template: `
    @if (tournament.tournament()?.status === 'running' && clock.startTime()) {
      <div class="flex items-center">
        <div
          class="flex items-center gap-3 rounded-full border-2 p-2 px-6 text-2xl font-black font-score transition-all md:text-5xl"
          [class]="clock.isFinished()
            ? 'bg-destructive text-destructive-foreground border-destructive animate-pulse'
            : 'bg-primary text-primary-foreground border-primary-foreground/20 shadow-xl'"
        >
          <span class="tracking-tighter">{{ formatted() }}</span>
        </div>
      </div>
    }
  `,
})
export class ClockDisplayComponent implements OnInit, OnDestroy {
  protected readonly clock = inject(ClockService);
  protected readonly tournament = inject(TournamentService);
  protected readonly formatted = computed(() => formatTime(this.clock.remainingTime()));

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private pollHandle: ReturnType<typeof setInterval> | undefined;

  ngOnInit(): void {
    if (!this.isBrowser) return;
    // Poll every 30s while a tournament is running, mirroring the original effect.
    this.pollHandle = setInterval(() => {
      if (this.tournament.tournament()?.status === 'running') {
        this.clock.refreshClock();
      }
    }, 30000);
  }

  ngOnDestroy(): void {
    clearInterval(this.pollHandle);
  }
}
