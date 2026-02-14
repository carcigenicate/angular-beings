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
  being: Being;

  constructor(hostBeing: Being) {
    this.being = hostBeing;
  }

  abstract updateDestination(ctx: DestinationBehaviorContext): void;
}

export class LimitedMemoryChaseEnemy extends DestinationBehavior {
  forceRandomPositionAt: number | null = null;
  minFollowTime: number;
  maxFollowTime: number;

  constructor(being: Being, minFollowTime: number, maxFollowTime: number) {
    super(being);
    this.minFollowTime = minFollowTime;
    this.maxFollowTime = maxFollowTime;
  }

  assignNewTemporaryTargetBeing(newTarget: Being, targetFor: number = 2000) {
    this.being.destination = newTarget;

    if (!this.forceRandomPositionAt) {
      this.forceRandomPositionAt = Date.now() + targetFor;
    }
  }

  private assignNewDestination(ctx: DestinationBehaviorContext) {
    const { positionIndex, world: { width, height }} = ctx;

    const closestNonAlly = ctx.positionIndex.getRandomNear(this.being.position, Math.max(width, height) / 4, (neighbor) => {
      return neighbor.group !== this.being.group && this.being.id !== neighbor.id;
    });

    if (closestNonAlly) {
      this.assignNewTemporaryTargetBeing(closestNonAlly, randomUtil.randomInt(this.minFollowTime, this.maxFollowTime));
    } else {
      this.being.destination = randomUtil.randomPosition(width, height);
    }
  }

  override updateDestination(ctx: DestinationBehaviorContext): void {
    const { world: { width, height } } = ctx;

    const currentTime = Date.now();

    if (this.forceRandomPositionAt && currentTime >= this.forceRandomPositionAt) {
      this.being.destination = randomUtil.randomPosition(width, height);
      this.forceRandomPositionAt = null;
    } else {
      if (mathUtil.distanceTo(this.being.position, this.being.getDestinationPosition()) <= 1) {
        this.assignNewDestination(ctx);
      }
    }
  }
}
