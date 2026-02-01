import { Position } from '../models/Misc';

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function selectRandom<T>(options: T[]): T {
  const i = randomInt(0, options.length - 1);
  return options[i];
}

export function randomPosition(width: number, height: number): Position {
  return {
    x: randomInt(0, width),
    y: randomInt(0, height),
  };
}
