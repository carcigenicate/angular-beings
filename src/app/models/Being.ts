import _ from 'lodash';

import * as mathUtil from '../util/math'

import { Position } from './Misc';

export type Genes = {
  maxHealth: number;
  strength: number;
  speed: number;
  size: number;
}

export type Sex = 'male' | 'female';

export class Being {
  health: number;

  sex: Sex;
  genes: Genes;
  group: string;
  pregnancy?: {
    dueAt: number;
  };

  position: Position;
  destination: Position | Being;

  constructor(genes: Genes, sex: Sex, group: string, startingPosition: Position) {
    this.genes = _.cloneDeep(genes);
    this.health = genes.maxHealth;
    this.sex = sex;
    this.group = group;
    this.position = _.cloneDeep(startingPosition);
    this.destination = _.cloneDeep(startingPosition);
  }

  getDestinationPosition(): Position {
    if (this.destination instanceof Being) {
      return this.destination.position;
    } else {
      return this.destination;
    }
  }

  moveTowardsDestinationBy(distance: number) {
    const destPosition = this.getDestinationPosition();
    const { x: destX, y: destY } = destPosition;
    const { x, y } = this.position;

    const xTo = destX - x;
    const yTo = destY - y;

    const angle = Math.atan2(yTo, xTo);

    const distanceToDestination = mathUtil.distanceTo(this.position, destPosition);
    const moveByDistance = Math.min(distance, distanceToDestination);

    const xDelta = Math.cos(angle) * distance;
    const yDelta = Math.sin(angle) * distance;

    this.position.x += xDelta;
    this.position.y += yDelta;
  }
}

