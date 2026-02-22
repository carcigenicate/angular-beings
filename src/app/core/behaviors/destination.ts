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
    currentTime: number,
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

  protected assignNewTemporaryTargetBeing(being: Being, newTarget: Being, currentTime: number, targetFor: number = 2000) {
    being.destination = newTarget;

    if (!this.forceRandomPositionAt) {
      this.forceRandomPositionAt = currentTime + targetFor;
    }
  }

  protected assignNewDestination(being: Being, ctx: DestinationBehaviorContext) {
    const { positionIndex, world: { width, height, currentTime }} = ctx;

    const closestNonAlly = ctx.positionIndex.getRandomNear(being.position, Math.max(width, height) / 4, (neighbor) => {
      return neighbor.group !== being.group && being.id !== neighbor.id;
    });

    if (closestNonAlly) {
      this.assignNewTemporaryTargetBeing(being, closestNonAlly, currentTime, randomUtil.randomInt(this.minFollowTime, this.maxFollowTime));
    } else {
      being.destination = randomUtil.randomPosition(width, height);
    }
  }

  override updateDestination(being: Being, ctx: DestinationBehaviorContext): void {
    const { world: { width, height } } = ctx;

    const currentTime = ctx.world.currentTime;

    if (this.forceRandomPositionAt && currentTime >= this.forceRandomPositionAt) {
      being.destination = randomUtil.randomPosition(width, height);
      this.forceRandomPositionAt = null;
    } else {
      if (being.distanceToDestination() <= 1) {
        this.assignNewDestination(being, ctx);
      }
    }
  }
}

export class LimitedMemoryChaseHomeBaseEnemy extends LimitedMemoryChaseEnemy {
  homeBasePosition: Position;
  variation: number;
  targetHomeBaseChance: number;

  constructor(minFollowTime: number, maxFollowTime: number, homeBasePosition: Position, variation: number, targetHomeBaseChance: number) {
    super(minFollowTime, maxFollowTime);
    this.homeBasePosition = homeBasePosition;
    this.variation = variation;
    this.targetHomeBaseChance = targetHomeBaseChance;
  }

  override assignNewDestination(being: Being, ctx: DestinationBehaviorContext) {
    const { world: { width, height } } = ctx;
    const { x: hx, y: hy } = this.homeBasePosition;

    const halfVariation = this.variation / 2;

    if (being.destination instanceof Position && being.destination.inWithin(hx - halfVariation, hx + halfVariation, hy - halfVariation, hx + halfVariation)) {
      super.assignNewDestination(being, ctx);
    } else if (randomUtil.randomChance(this.targetHomeBaseChance)) {
      const newPosition = new Position(
        randomUtil.randomInt(hx - halfVariation, hx + halfVariation),
        randomUtil.randomInt(hy - halfVariation, hy + halfVariation),
      );

      being.destination = mathUtil.clampPositionToBounds(newPosition, width, height);
    } else {
      super.assignNewDestination(being, ctx);
    }
  }
}
