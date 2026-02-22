import { Position } from '../models/Misc';
import * as mathUtil from './math';

// max is exclusive

export function randomInt(min: number, max: number) {
  return Math.floor(randomFloat(min, max));
}

export function randomFloat(min: number, max: number) {
  return (Math.random() * (max - min)) + min;
}

export function selectRandom<T>(options: T[]): T {
  const i = randomInt(0, options.length);
  return options[i];
}

export function randomPosition(width: number, height: number): Position {
  return new Position(
    randomInt(0, width),
    randomInt(0, height),
  );
}

export function randomChance(chancePerc: number): boolean {
  return Math.random() < chancePerc;
}

export function randomDistantPointsWithin(width: number, height: number, nPoints: number, attempts: number): Position[] {
  const halfWidth = width / 2;
  const halfHeight = height / 2;

  let bestPoints: Position[] = [];
  let bestDistance: number = -Infinity;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const points: Position[] = [];
    for (let pointN = 0; pointN < nPoints; pointN++) {
      points.push(randomPosition(width, height));
    }

    let currentDistance: number = 0;
    for (const pointTwo of points) {
      for (const pointOne of points) {
        if (pointOne != pointTwo) {
          currentDistance += mathUtil.distanceTo(pointOne, pointTwo);
        }
      }

      let wallDistance = 0;
      if (pointTwo.x > halfWidth) {
        wallDistance += width - pointTwo.x;
      } else {
        wallDistance += pointTwo.x;
      }

      if (pointTwo.y > halfHeight) {
        wallDistance += height - pointTwo.y;
      } else {
        wallDistance += pointTwo.y;
      }

      currentDistance += wallDistance * 3;
    }

    if (currentDistance > bestDistance) {
      bestDistance = currentDistance;
      bestPoints = points;
    }
  }

  return bestPoints;
}
