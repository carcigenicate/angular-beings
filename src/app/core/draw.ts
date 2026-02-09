import { effect, Injectable, OnDestroy, signal } from '@angular/core';
import { Being } from '../models/Being';
import { Environment } from './environment';
import { filter, Subscription } from 'rxjs';

type DrawFunction = (ctx: CanvasRenderingContext2D) => void;

interface PersistentEffect {
  expiresAt: number;
  drawF: DrawFunction;
}

@Injectable()
export class Draw implements OnDestroy {

  canvas!: HTMLCanvasElement;
  groupColors: Record<string, string> = {};
  lastDrawTimestamp: number = 0;

  isDrawing: boolean = false;

  activeEffects: PersistentEffect[] = [];

  frameCount = signal<number>(0);

  subs: Subscription = new Subscription();

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

    this.subs.add(
      this.environmentService.beingDied$.pipe(
        filter(() => this.environmentService.isDebugMode()),
      ).subscribe((being) => {
        const { position, genes: { size }} = being;
        const effectSize = size * 5;

        this.startPersistentEffect(2000, (ctx: CanvasRenderingContext2D) => {
          ctx.strokeStyle = '#FF0000';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(position.x - effectSize / 2, position.y);
          ctx.lineTo(position.x + effectSize / 2, position.y);
          ctx.stroke();
          ctx.closePath();
        });
      })
    );

    this.subs.add(
      this.environmentService.beingBorn$.pipe(
        filter(() => this.environmentService.isDebugMode()),
      ).subscribe((being) => {
        const { position, genes: { size }} = being;
        const effectSize = size * 5;

        const bornAt = Date.now();

        this.startPersistentEffect(2000, (ctx: CanvasRenderingContext2D) => {
          ctx.strokeStyle = '#00FF00';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(position.x - effectSize / 2, position.y);
          ctx.lineTo(position.x + effectSize / 2, position.y);

          ctx.moveTo(position.x, position.y - effectSize / 2);
          ctx.lineTo(position.x, position.y + effectSize / 2);
          ctx.stroke();
          ctx.closePath();
        });
      })
    );

    this.subs.add(
      this.environmentService.bombDetonated$.subscribe(({ position, diameter }) => {
        this.startPersistentEffect(2000, (ctx: CanvasRenderingContext2D) => {
          ctx.strokeStyle = '#FF0000';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(position.x, position.y, diameter / 2, 0,  2 * Math.PI);
          ctx.stroke();
        });
      }),
    )
  }

  initialize(canvas: HTMLCanvasElement, groupColors: Record<string, string>) {
    this.canvas = canvas;
    this.groupColors = groupColors;
  }

  startPersistentEffect(dueIn: number, drawF: DrawFunction) {
    const effect: PersistentEffect = {
      expiresAt: Date.now() + dueIn,
      drawF: drawF,
    };

    this.activeEffects.push(effect);
  }

  drawAndUpdateEffects() {
    const ctx = this.ctx;
    const currentTime = Date.now();

    this.activeEffects = this.activeEffects.filter((effect) => {
      if (currentTime > effect.expiresAt) {
        return false;

      } else {
        ctx.save();
        effect.drawF(ctx);
        ctx.restore();

        return true;
      }
    });
  }

  drawBeing(being: Being) {
    const ctx = this.ctx;
    const { position: { x, y }, genes: { size }, group } = being;

    ctx.save();

    const color = this.groupColors[group];
    if (!color) {
      throw new Error(`Unknown group ${group}`);
    }

    const halfSize = size / 2;
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = color;
    ctx.fillRect(x - halfSize, y - halfSize, size, size);

    if (this.environmentService.selectedBeing()?.id == being.id) {
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 5;
      ctx.strokeRect(x - halfSize, y - halfSize, size, size);
    }

    ctx.restore();
  }

  draw(timestamp: number) {
    const beings = this.environmentService.beings();

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
      }

      ctx.save();
      // ctx.translate(-size, -size);

      this.drawBeing(being);

      ctx.restore();
    }

    this.drawAndUpdateEffects();

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

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
