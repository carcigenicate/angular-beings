import {
  Component,
  OnDestroy,
  OnInit,
  input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener,
  signal, ChangeDetectorRef
} from '@angular/core';

import { Environment } from '../environment';
import { Draw } from '../draw';
import { Being, Genes } from '../../models/Being';
import * as randomUtil from '../../util/random';
import { Button } from 'primeng/button';
import { AsyncPipe, DatePipe, DecimalPipe, JsonPipe } from '@angular/common';
import { IsInstanceOfPipe } from '../is-instance-of-pipe';

@Component({
  selector: 'app-main-canvas',
  imports: [
    Button,
    AsyncPipe,
    JsonPipe,
    DecimalPipe,
    DatePipe,
    IsInstanceOfPipe
  ],
  templateUrl: './main-canvas.html',
  styleUrl: './main-canvas.scss',
  providers: [
    Environment,
    Draw,
  ]
})
export class MainCanvas implements OnInit, AfterViewInit, OnDestroy {
  gameWidth = input.required<number>();
  gameHeight = input.required<number>();

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  groupColors: Record<string, string> = {
    Red: '#FF0000',
    Green: '#00FF00',
    Blue: '#0000FF',
  };

  startingGenes: Genes = {
    maxHealth: 100,
    size: 5,
    speed: 500,
    strength: 1,
  }

  selectedBeing = signal<Being | null>(null);

  constructor(
    public environmentService: Environment,
    public drawService: Draw,
  ) {
  }

  ngOnInit() {
    const beings = this.createNewBeings(1000, this.startingGenes, Object.keys(this.groupColors));

    this.environmentService.initialize(this.gameWidth(), this.gameHeight(), beings);
  }

  ngAfterViewInit() {
    console.log('Draw service initializing')
    this.drawService.initialize(this.canvasRef.nativeElement, this.groupColors);
    console.log('Draw service initialized')
    this.environmentService.resume();
  }

  createNewBeings(count: number, startingGenes: Genes, groups: string[]): Being[] {
    const beings: Being[] = [];
    for (let n = 0; n < count; n++) {
      const sex = randomUtil.randomInt(0, 1) === 0 ? 'male' : 'female';
      const group = randomUtil.selectRandom(groups);
      const position = randomUtil.randomPosition(this.gameWidth(), this.gameHeight());
      const destination = randomUtil.randomPosition(this.gameWidth(), this.gameHeight());

      const being = new Being(startingGenes, sex, group, position);
      being.destination = destination;

      beings.push(being);
    }

    return beings;
  }

  togglePause() {
    if (this.environmentService.isPaused()) {
      this.environmentService.resume();
    } else {
      this.environmentService.pause();
    }
  }

  toggleDebugMode() {
    this.environmentService.isDebugMode.update((isDebugMode) => !isDebugMode);
  }

  onCanvasClick($event: MouseEvent) {
    const bounds = this.canvasRef.nativeElement.getBoundingClientRect();
    const being = this.environmentService.getBeingAt($event.clientX - bounds.left, $event.clientY - bounds.top);
    this.selectedBeing.set(being);
  }

  ngOnDestroy(): void {

  }

  protected readonly Being = Being;
}
