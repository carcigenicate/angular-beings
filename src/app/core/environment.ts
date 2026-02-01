import { Injectable, signal } from '@angular/core';

import _ from 'lodash';

import { Being, Genes } from '../models/Being';
import * as randomUtil from '../util/random';
import * as mathUtil from '../util/math';
import { Position } from '../models/Misc';

@Injectable()
export class Environment {
  width: number;
  height: number;

  beings: Being[] = [];

  updateTimer?: ReturnType<typeof setInterval>;
  lastUpdateTimestamp: number = Date.now().valueOf();

  isPaused = signal(true);

  constructor() {
    this.width = 0;
    this.height = 0;
  }

  initialize(width: number, height: number, beings: Being[]) {
    this.width = width;
    this.height = height;
    this.beings = beings;

    this.startUpdating();
  }

  updateBeing(being: Being, updatePercentage: number) {
    being.moveTowardsDestinationBy(being.genes.speed * updatePercentage);

    if (mathUtil.distanceTo(being.position, being.getDestinationPosition()) < being.genes.speed) {
      if (randomUtil.randomInt(0, 1) === 1) {
        being.destination = randomUtil.randomPosition(this.width, this.height);
      } else {
        being.destination = randomUtil.selectRandom(this.beings);
      }
    }
  }

  update(updatePercentage: number) {
    for (const being of this.beings) {
      this.updateBeing(being, updatePercentage);
    }
  }

  startUpdating() {
    this.updateTimer = setInterval(() => {
      const currentTimestamp = Date.now().valueOf();
      const updatePerc = 1 / (this.lastUpdateTimestamp - currentTimestamp);

      this.update(/*updatePerc*/1);
    }, 10)
  }

  stopUpdating() {
    clearInterval(this.updateTimer);
    this.updateTimer = undefined;
  }

  pause() {
    this.isPaused.set(true);
    this.stopUpdating();
  }

  resume() {
    this.isPaused.set(false);
    this.startUpdating();
  }
}
