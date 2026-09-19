// Tap applies one step immediately; holding repeats it so big swings don't
// take dozens of individual taps. Shared by the life points and Angelechy counters.
export class HoldRepeat {
  private timeout?: ReturnType<typeof setTimeout>;
  private interval?: ReturnType<typeof setInterval>;

  start(fire: () => void): void {
    fire();
    this.timeout = setTimeout(() => {
      this.interval = setInterval(fire, 150);
    }, 450);
  }

  stop(): void {
    clearTimeout(this.timeout);
    clearInterval(this.interval);
  }
}
