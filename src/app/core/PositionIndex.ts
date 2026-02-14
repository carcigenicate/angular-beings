import Fatbrush from 'flatbush';

import * as mathUtil from '../util/math';
import * as randomUtil from '../util/random';
import { Being } from '../models/Being';
import { Position } from '../models/Misc';

export class PositionIndex {
  private indexLookup: Record<string, Being>;
  private index: Fatbrush;

  constructor(beings: Being[]) {
    this.index = new Fatbrush(beings.length);
    this.indexLookup = {};

    for (const being of beings) {
      const halfSize = being.genes.size / 2;
      const { x, y } = being.position;

      const i = this.index.add(x - halfSize,  y - halfSize, x + halfSize, y + halfSize);
      this.indexLookup[i] = being;
    }

    this.index.finish();
  }

  findColliding(being: Being) {
    const halfSize = being.genes.size / 2;
    const { x, y } = being.position;

    const found = this.index.search(x - halfSize,  y - halfSize, x + halfSize, y + halfSize, (neighborI) => {
      const neighborBeing = this.indexLookup[neighborI];
      return neighborBeing !== being;
    });

    return found.map((i) => this.indexLookup[i]);
  }

  findWithin(position: Position, radii: number, predicate: (being: Being) => boolean = (() => true)): Being[] {
    const { x, y } = position;

    const foundWithin = this.index.search(x - radii, y - radii, x + radii, y + radii, (i) => {
      const being = this.indexLookup[i];
      return predicate(being);
    });

    return foundWithin.map((i) => this.indexLookup[i])
  }

  findClosestTo(position: Position, radii: number, predicate: (being: Being) => boolean = (() => true)): Being | null {
    const foundWithinBeings = this.findWithin(position, radii, predicate);

    let minDist = Infinity;
    let closestBeing: Being | null = null;
    for (const neighborBeing of foundWithinBeings) {
      const dist = mathUtil.distanceTo(position, neighborBeing.position);
      if (closestBeing === null || dist < minDist) {
        closestBeing = neighborBeing;
        minDist = dist;
      }
    }

    return closestBeing;
  }

  getRandomNear(position: Position, radii: number, predicate: (being: Being) => boolean = (() => true)) {
    const foundWithinBeings = this.findWithin(position, radii, predicate);

    return randomUtil.selectRandom(foundWithinBeings);
  }

}
