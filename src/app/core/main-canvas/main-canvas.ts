import { Component, OnDestroy, OnInit, input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

import { Environment } from '../environment';
import { Draw } from '../draw';
import { Being, Genes } from '../../models/Being';
import * as randomUtil from '../../util/random';

@Component({
  selector: 'app-main-canvas',
  imports: [],
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
    size: 25,
    speed: 5,
    strength: 1,
  }

  constructor(
    private environmentService: Environment,
    private drawService: Draw,
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

  ngOnDestroy(): void {

  }
}
