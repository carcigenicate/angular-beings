import { effect, Injectable } from '@angular/core';
import { Being } from '../models/Being';
import { Environment } from './environment';

@Injectable()
export class Draw {

  canvas!: HTMLCanvasElement;
  groupColors: Record<string, string> = {};
  lastDrawTimestamp: number = 0;

  isDrawing: boolean = false;

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

    ctx.fillStyle = color;
    ctx.fillRect(x, y, size, size);

    const { x: destX, y: destY } = being.getDestinationPosition();
    ctx.strokeText(`D: ${destX},${destY}`, destX, destY);

    ctx.restore();
  }

  draw(timestamp: number) {
    const beings = this.environmentService.beings;

    const ctx = this.ctx;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const being of beings) {
      this.drawBeing(being);
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
