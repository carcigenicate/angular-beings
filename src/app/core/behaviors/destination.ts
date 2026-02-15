import { Position } from '../../models/Misc';
import { Being } from '../../models/Being';
import { PositionIndex } from '../PositionIndex';
import * as randomUtil from '../../util/random';
import * as mathUtil from '../../util/math';

export interface DestinationBehaviorContext {
  allBeings: Being[];
  positionIndex: PositionIndex,
  world: {
    width: number,
    height: number,
  }
}

export abstract class DestinationBehavior {
  abstract updateDestination(being: Being, ctx: DestinationBehaviorContext): void;
}

export class LimitedMemoryChaseEnemy extends DestinationBehavior {
  forceRandomPositionAt: number | null = null;
  minFollowTime: number;
  maxFollowTime: number;

  constructor(minFollowTime: number, maxFollowTime: number) {
    super();
    this.minFollowTime = minFollowTime;
    this.maxFollowTime = maxFollowTime;
  }

  assignNewTemporaryTargetBeing(being: Being, newTarget: Being, targetFor: number = 2000) {
    being.destination = newTarget;

    if (!this.forceRandomPositionAt) {
      this.forceRandomPositionAt = Date.now() + targetFor;
    }
  }

  private assignNewDestination(being: Being, ctx: DestinationBehaviorContext) {
    const { positionIndex, world: { width, height }} = ctx;

    const closestNonAlly = ctx.positionIndex.getRandomNear(being.position, Math.max(width, height) / 4, (neighbor) => {
      return neighbor.group !== being.group && being.id !== neighbor.id;
    });

    if (closestNonAlly) {
      this.assignNewTemporaryTargetBeing(being, closestNonAlly, randomUtil.randomInt(this.minFollowTime, this.maxFollowTime));
    } else {
      being.destination = randomUtil.randomPosition(width, height);
    }
  }

  override updateDestination(being: Being, ctx: DestinationBehaviorContext): void {
    const { world: { width, height } } = ctx;

    const currentTime = Date.now();

    if (this.forceRandomPositionAt && currentTime >= this.forceRandomPositionAt) {
      being.destination = randomUtil.randomPosition(width, height);
      this.forceRandomPositionAt = null;
    } else {
      if (mathUtil.distanceTo(being.position, being.getDestinationPosition()) <= 1) {
        this.assignNewDestination(being, ctx);
      }
    }
  }
}
