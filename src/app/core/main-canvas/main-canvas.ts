import {
  Component,
  OnDestroy,
  OnInit,
  input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  HostListener,
  signal, ChangeDetectorRef, Pipe, PipeTransform, DoCheck
} from '@angular/core';

import { Environment } from '../environment';
import { Draw } from '../draw';
import {
  Behaviors,
  Being,
  fuzzGenes,
  Genes,
  Sex
} from '../../models/Being';
import * as randomUtil from '../../util/random';
import * as elementUtil from '../../util/element';
import { Button } from 'primeng/button';
import { AsyncPipe, DatePipe, DecimalPipe, JsonPipe, KeyValuePipe, SlicePipe } from '@angular/common';

import _ from 'lodash';
import { v4 as uuid } from 'uuid';

import config from '../../config';
import { Toolbar } from 'primeng/toolbar';
import { IsInstanceOfPipe } from '../is-instance-of-pipe';
import { Dialog } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ProgressBar } from 'primeng/progressbar';
import { Card } from 'primeng/card';
import { Divider } from 'primeng/divider';
import { InputNumber } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { BeingEditor } from '../being-editor/being-editor';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import {
  DestinationBehavior,
  LimitedMemoryChaseEnemy,
  LimitedMemoryChaseHomeBaseEnemy
} from '../behaviors/destination';
import { OverviewTable } from '../overview-table/overview-table';
import { AgePipe } from '../../pipes/age';
import { Tag } from 'primeng/tag';
import { Position } from '../../models/Misc';

type MouseMode = 'select' | 'bomb';
type DialogView = null | 'examine-beings' | 'create-being';

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
    EnvironmentCursorPipe,
    Toolbar,
    Dialog,
    TableModule,
    Divider,
    FormsModule,
    BeingEditor,
    Tab,
    Tabs,
    TabPanel,
    TabPanels,
    TabList,
    OverviewTable,
    KeyValuePipe,
    AgePipe,
    DecimalPipe,
    Tag
  ],
  templateUrl: './main-canvas.html',
  styleUrl: './main-canvas.scss',
  providers: [
    Environment,
    Draw,
  ]
})
export class MainCanvas implements OnInit, AfterViewInit, DoCheck, OnDestroy {
  gameWidth = input.required<number>();
  gameHeight = input.required<number>();

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  groupColors: Record<string, string> = {
    Red: 'red',
    Green: 'green',
    Blue: 'blue',
    Pink: 'pink',
    Orange: 'orange',
  };

  startingGenes: Genes = {
    maxHealth: 100,
    size: 5,
    speed: 500,
    attack: config.GENE_FUZZ_AMOUNT,
    defense: config.GENE_FUZZ_AMOUNT,
  }

  mouseMode = signal<MouseMode>('select');

  dialogView = signal<DialogView>(null);

  createNewBeingModel!: Being;

  currentPanel: 'overview' | 'selected-being' | 'add-being' = 'overview';

  constructor(
    public environmentService: Environment,
    public drawService: Draw,
  ) {
  }

  ngOnInit() {
    // const beings = this.createRandomHomeBaseBeings(1000, this.startingGenes, Object.keys(this.groupColors));
    const beings = this.createRandomLimitedChaseBeings(1000, this.startingGenes, Object.keys(this.groupColors));

    this.createNewBeingModel = Being.fromRaw(beings[0]);

    this.environmentService.initialize(this.gameWidth(), this.gameHeight(), beings);
  }

  ngDoCheck() {

  }

  ngAfterViewInit() {
    this.drawService.initialize(this.canvasRef.nativeElement, this.groupColors);
    this.environmentService.resume();
  }

  createRandomBaseBeing(startingGenes: Genes, groups: string[]): Being {
    const sex: Sex = randomUtil.selectRandom(['male', 'female']);
    const group = randomUtil.selectRandom(groups);
    const position = randomUtil.randomPosition(this.gameWidth(), this.gameHeight());
    const destination = randomUtil.randomPosition(this.gameWidth(), this.gameHeight());
    const fuzzedGenes = fuzzGenes(startingGenes, config.GENE_FUZZ_AMOUNT);

    const being = new Being(this.environmentService.now(), fuzzedGenes, sex, group, position);
    being.destination = destination;

    return being;
  }

  createRandomLimitedChaseBeings(count: number, startingGenes: Genes, groups: string[]): Being[] {
    const beings: Being[] = [];
    for (let n = 0; n < count; n++) {
      const being = this.createRandomBaseBeing(startingGenes, groups);
      being.behaviors = {
        destination: new LimitedMemoryChaseEnemy(config.MIN_FOLLOWING_TIME, config.MAX_FOLLOWING_TIME),
      };

      beings.push(being);
    }

    return beings;
  }

  createRandomHomeBaseBeings(count: number, startingGenes: Genes, groups: string[]): Being[] {
    const randomHomeBases = randomUtil.randomDistantPointsWithin(this.gameWidth(), this.gameHeight(), groups.length, 5000);

    const zippedHomeBases = _.zip(randomHomeBases, groups) as [Position, string][];

    const groupHomeBases: Record<string, Position> = {};
    for (const [homeBasePosition, group] of zippedHomeBases) {
      this.drawService.startPersistentEffect(300000, (ctx) => {
        ctx.strokeStyle = this.groupColors[group];
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(homeBasePosition.x, homeBasePosition.y, 20, 0,  2 * Math.PI);
        ctx.stroke();
      })

      groupHomeBases[group] = homeBasePosition;
    }

    const beings: Being[] = [];
    for (let n = 0; n < count; n++) {
      const being = this.createRandomBaseBeing(startingGenes, groups);
      const homeBasePosition = groupHomeBases[being.group];
      being.behaviors = {
        destination: new LimitedMemoryChaseHomeBaseEnemy(config.MIN_FOLLOWING_TIME, config.MAX_FOLLOWING_TIME, homeBasePosition, 10, 0.3),
      };

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
    const { x, y } = elementUtil.getClickPosition(this.canvasRef.nativeElement, $event);

    if (this.mouseMode() === 'select') {
      this.selectBeingAt(x, y);
    } else {
      this.bombAreaAt(x, y);
    }
  }

  selectBeingAt(x: number, y: number) {
    const selectedBeing = this.environmentService.selectBeingAt(x, y);
    if (selectedBeing) {
      this.currentPanel = 'selected-being';
    }

  }

  bombAreaAt(x: number, y: number) {
    this.environmentService.bombArea(new Position(x, y), 500, 1000);
  }

  dialogVisibilityChanged(newVisibility: boolean) {
    if (!newVisibility) {
      this.dialogView.set(null);
    }
  }

  createBeingFromModel() {
    const beingCopy = _.cloneDeep(this.createNewBeingModel);
    const newBeing = Being.fromRaw(beingCopy);
    this.createNewBeingModel.id = uuid();

    this.environmentService.addBeing(newBeing);
  }

  ngOnDestroy(): void {

  }

  protected readonly Being = Being;
}
