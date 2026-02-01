import { Position } from '../models/Misc';

export function distanceTo(positionOne: Position, positionTwo: Position): number {
  const xDelta = positionOne.x - positionTwo.x;
  const yDelta = positionOne.y - positionTwo.y;

  return Math.sqrt(xDelta * xDelta + yDelta * yDelta);
}
