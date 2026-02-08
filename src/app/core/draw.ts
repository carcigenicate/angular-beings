import { effect, Injectable, signal } from '@angular/core';
import { Being } from '../models/Being';
import { Environment } from './environment';

@Injectable()
export class Draw {

  canvas!: HTMLCanvasElement;
  groupColors: Record<string, string> = {};
  lastDrawTimestamp: number = 0;

  isDrawing: boolean = false;

  frameCount = signal<number>(0);

  constructor(
    private environmentService: Environment,
  ){
    effect(() => {
      const isPaused = this.environmentService.isPaused();

      if (isPaused) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  initialize(canvas: HTMLCanvasElement, groupColors: Record<string, string>) {
    this.canvas = canvas;
    this.groupColors = groupColors;
  }

  drawBeing(being: Being) {
    const ctx = this.ctx;
    const { position: { x, y }, genes: { size }, group } = being;

    ctx.save();

    const color = this.groupColors[group];
    if (!color) {
      throw new Error(`Unknown group ${group}`);
    }

    ctx.strokeStyle = '#000000';
    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);

    ctx.restore();
  }

  draw(timestamp: number) {
    const beings = this.environmentService.beings;

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const being of beings) {
      this.frameCount.update((count) => count + 1);

      const { position: { x, y }, genes: { size }} = being;
      const { x: destX, y: destY } = being.getDestinationPosition();
      const halfSize = size / 2;

      if (this.environmentService.isDebugMode()) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';

        ctx.beginPath();
        ctx.moveTo(being.position.x, being.position.y);
        ctx.lineTo(destX, destY);
        ctx.stroke();
        ctx.closePath();
        ctx.restore();

        const colliding = this.environmentService.positionIndex.findColliding(being);
        for (const collidingBeing of colliding) {
          ctx.save();

          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillText('COLLIDING!', collidingBeing.position.x, collidingBeing.position.y);

          ctx.restore();
        }
      }

      ctx.save();
      // ctx.translate(-size, -size);

      this.drawBeing(being);

      ctx.restore();
    }

    this.lastDrawTimestamp = timestamp;

    if (this.isDrawing) {
      requestAnimationFrame(this.draw.bind(this));
    }
  }

  get ctx(): CanvasRenderingContext2D {
    return this.canvas.getContext('2d') as CanvasRenderingContext2D;
  }

  pause() {
    this.isDrawing = false;
  }

  resume() {
    this.isDrawing = true;
    requestAnimationFrame(this.draw.bind(this));
  }
}
