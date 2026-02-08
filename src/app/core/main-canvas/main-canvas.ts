import {
  Component,
  OnDestroy,
  OnInit,
  input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener,
  signal, ChangeDetectorRef, Pipe, PipeTransform
} from '@angular/core';

import { Environment } from '../environment';
import { Draw } from '../draw';
import { Being, fuzzGenes, Genes, Sex } from '../../models/Being';
import * as randomUtil from '../../util/random';
import { Button } from 'primeng/button';
import { AsyncPipe, DatePipe, DecimalPipe, JsonPipe } from '@angular/common';

import config from '../../config';
import { Toolbar } from 'primeng/toolbar';
import { IsInstanceOfPipe } from '../is-instance-of-pipe';

type MouseMode = 'select' | 'bomb';

@Pipe({
  name: 'modeCursor',
})
export class EnvironmentCursorPipe implements PipeTransform {

  transform(mode: MouseMode){
    switch(mode) {
      case 'select': return 'default';
      case 'bomb': return 'all-scroll';
    }
  }

}

@Component({
  selector: 'app-main-canvas',
  imports: [
    Button,
    AsyncPipe,
    JsonPipe,
    DecimalPipe,
    EnvironmentCursorPipe,
    IsInstanceOfPipe,
    Toolbar
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
    size: 10,
    speed: 250,
    attack: config.GENE_FUZZ_AMOUNT,
    defense: config.GENE_FUZZ_AMOUNT,
  }

  selectedBeing = signal<Being | null>(null);

  mouseMode = signal<MouseMode>('select');

  constructor(
    public environmentService: Environment,
    public drawService: Draw,
  ) {
  }

  ngOnInit() {
    const beings = this.createNewBeings(100, this.startingGenes, Object.keys(this.groupColors));

    this.environmentService.initialize(this.gameWidth(), this.gameHeight(), beings);
  }

  ngAfterViewInit() {
    this.drawService.initialize(this.canvasRef.nativeElement, this.groupColors);
    this.environmentService.resume();
  }

  createNewBeings(count: number, startingGenes: Genes, groups: string[]): Being[] {
    const beings: Being[] = [];
    for (let n = 0; n < count; n++) {
      const sex: Sex = randomUtil.selectRandom(['male', 'female']);
      const group = randomUtil.selectRandom(groups);
      const position = randomUtil.randomPosition(this.gameWidth(), this.gameHeight());
      const destination = randomUtil.randomPosition(this.gameWidth(), this.gameHeight());

      const fuzzedGenes = fuzzGenes(startingGenes, config.GENE_FUZZ_AMOUNT);
      const being = new Being(fuzzedGenes, sex, group, position);
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
    const x = $event.clientX - bounds.left;
    const y = $event.clientY - bounds.top;

    if (this.mouseMode() === 'select') {
      this.selectBeingAt(x, y);
    } else {
      this.bombAreaAt(x, y);
    }
  }

  bombAreaAt(x: number, y: number) {
    this.environmentService.bombArea({ x: x, y: y }, 500, 1000);
  }

  selectBeingAt(x: number, y: number) {
    const being = this.environmentService.getBeingAt(x, y);
    this.selectedBeing.set(being);
  }

  ngOnDestroy(): void {

  }

  protected readonly Being = Being;
}
