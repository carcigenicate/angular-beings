export class GameClock {
  private readonly startTime: number;

  private pausedStartTime: number | null = null;
  private totalPausedTime: number = 0

  constructor(startTime: number = Date.now()) {
    this.startTime = startTime;
  }

  pause() {
    this.pausedStartTime = Date.now();
  }

  resume() {
    if (this.pausedStartTime !== null) {
      this.totalPausedTime += Date.now() - this.pausedStartTime;
      this.pausedStartTime = null;
    }
  }

  now() {
    const now = this.pausedStartTime ?? Date.now();
    return now - this.startTime - this.totalPausedTime;
  }
}
