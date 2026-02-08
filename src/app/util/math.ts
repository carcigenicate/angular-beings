import { Position } from '../models/Misc';

export function distanceTo(positionOne: Position, positionTwo: Position): number {
  const xDelta = positionOne.x - positionTwo.x;
  const yDelta = positionOne.y - positionTwo.y;

  return Math.sqrt(xDelta * xDelta + yDelta * yDelta);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function clampPositionToBounds(position: Position, width: number, height: number): Position {
  return {
    x: clamp(position.x, 0, width),
    y: clamp(position.y, 0, height),
  }
}
