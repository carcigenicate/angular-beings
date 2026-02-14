import { Injectable, signal } from '@angular/core';

import _ from 'lodash';

import { Being, Genes, Sex } from '../models/Being';
import * as randomUtil from '../util/random';
import * as mathUtil from '../util/math';
import { Position } from '../models/Misc';

import config from '../config';
import { BehaviorSubject, Subject } from 'rxjs';
import { PositionIndex } from './PositionIndex';
import { DestinationBehaviorContext } from './behaviors/destination';

export interface EnvironmentStats {
  beingsTargetingSpace: Being[];
  beingsTargetingBeing: Being[];
  groupCount: Record<string, number>;
  sexCount: {[sex in Sex]: number};
}

@Injectable()
export class Environment {
  width: number;
  height: number;

  private stats!: EnvironmentStats;

  updateTimer?: ReturnType<typeof setInterval>;
  lastUpdateTimestamp: number = Date.now().valueOf();

  positionIndex!: PositionIndex;

  beings = signal<Being[]>([]);

  selectedBeing = signal<Being | null>(null);
  isPaused = signal<boolean>(true);
  isDebugMode = signal<boolean>(false);
  currentStats = signal<EnvironmentStats>(this.stats);
  beingDied$: Subject<Being> = new Subject<Being>();
  beingBorn$: Subject<Being> = new Subject<Being>();
  bombDetonated$: Subject<{ position: Position, diameter: number }> = new Subject<{ position: Position, diameter: number }>()

  constructor() {
    this.width = 0;
    this.height = 0;

    this.resetStats();
  }

  initialize(width: number, height: number, beings: Being[]) {
    this.width = width;
    this.height = height;
    this.beings.set(beings);

    this.positionIndex = new PositionIndex(this.beings());

    this.startUpdating();
  }

  resetStats() {
    this.stats = {
      beingsTargetingBeing: [],
      beingsTargetingSpace: [],
      groupCount: {},
      sexCount: { male: 0, female: 0 },
    };
  }

  recordBeingStats(being: Being) {
    if (being.destination instanceof Being) {
      this.stats.beingsTargetingBeing.push(being);
    } else {
      this.stats.beingsTargetingSpace.push(being);
    }

    this.stats.groupCount[being.group] ??= 0;
    this.stats.groupCount[being.group] += 1;

    this.stats.sexCount[being.sex] += 1;
  }

  resolveCollisions(being: Being) {
    const allCollidingBeings = this.positionIndex.findColliding(being);

    for (const collidingBeing of allCollidingBeings) {
      if (being.group === collidingBeing.group) {
        if (being.sex !== collidingBeing.sex) {
          const [[male], [female]] = _.partition([being, collidingBeing], (b) => b.sex === 'male');

          male.impregnate(female, config.PREGNANCY_DURATION);
        }
      } else {
        being.attack(collidingBeing);
      }
    }
  }

  isOutOfBounds(being: Being) {
    const { x, y } = being.position;

    const xIsOob = x < 0 || x >= this.width;
    const yIsOob = y < 0 || y >= this.height;

    return xIsOob || yIsOob;
  }

  updateBeing(being: Being, updatePercentage: number) {
    const currentTime = Date.now();

    being.moveTowardsDestinationBy(being.genes.speed * updatePercentage);

    const ctx: DestinationBehaviorContext = {
      allBeings: this.beings(),
      positionIndex: this.positionIndex,
      world: { width: this.width, height: this.height },
    };
    being.updateDestination(ctx);

    if (being.pregnancyIsDue()) {
      const child = being.produceChild();
      this.beings.update((beings) => {
        beings.push(child);
        return beings;
      });
      this.beingBorn$.next(child);
    }

    if (this.isOutOfBounds(being)) {
      being.position = { x: this.width / 2, y: this.height / 2 };
    }

    this.resolveCollisions(being);
  }

  removeBeings(beingIds: string[]) {
    const removeBeingSet = new Set<string>(beingIds);
    this.beings.update((beings) => {
      beings = beings.filter((being) => !removeBeingSet.has(being.id));
      return beings;
    });
  }

  update(updatePercentage: number) {
    if (this.beings().length === 0) {
      // TODO: Handle better
      return;
    }

    if (this.beings().length > 2_000) {
        this.bombArea({ x: this.width / 2, y: this.height / 2 }, this.width / 2, 1000)
    }

    this.resetStats();

    this.positionIndex = new PositionIndex(this.beings());

    const beingsToRemove: string[] = []
    for (const being of this.beings()) {
      this.updateBeing(being, updatePercentage);
      this.recordBeingStats(being);

      if (being.isDead()) {
        beingsToRemove.push(being.id);
        this.markAsDead(being);
      }
    }

    this.removeBeings(beingsToRemove);

    this.currentStats.set(this.stats);
  }

  markAsDead(being: Being) {
    this.beingDied$.next(being);
    if (this.selectedBeing()?.id === being.id) {
      this.selectedBeing.set(null);
    }
  }

  killBeings(beings: Being[]) {
    const idsToRemove = [];
    for (const being of beings) {
      this.markAsDead(being);
      idsToRemove.push(being.id);
    }
    this.removeBeings(idsToRemove);
  }

  getBeingAt(x: number, y: number): Being | null {
    return this.positionIndex.findClosestTo({ x: x, y: y}, 50);
  }

  selectBeingAt(x: number, y: number): Being | null {
    const being = this.getBeingAt(x, y);

    if (being) {
      this.selectedBeing.set(being);
    }

    return being;
  }

  addBeing(being: Being) {
    this.beings.update((beings) => {
      beings.push(being);
      return beings;
    })
  }

  bombArea(position: Position, diameter: number, damage: number) {
    const beingsInArea = this.positionIndex.findWithin(position, diameter / 2);

    this.bombDetonated$.next({ position: position, diameter: diameter });

    for (const being of beingsInArea) {
      being.hurtBy(damage);
    }
  }

  startUpdating() {
    if (this.updateTimer) {
      this.stopUpdating();
    }

    this.updateTimer = setInterval(() => {
      const currentTimestamp = Date.now().valueOf();
      const updatePerc = (currentTimestamp - this.lastUpdateTimestamp) / 1000;

      this.update(updatePerc);
      this.lastUpdateTimestamp = Date.now().valueOf();
    }, 30)
  }

  stopUpdating() {
    clearInterval(this.updateTimer);
    this.updateTimer = undefined;
  }

  pause() {  // FIXME: Due-at timers are don't take into consideration pausing
    this.isPaused.set(true);
    this.stopUpdating();
  }

  resume() {
    this.isPaused.set(false);
    this.startUpdating();
  }
}
