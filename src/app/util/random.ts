import { Position } from '../models/Misc';

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
  return {
    x: randomInt(0, width),
    y: randomInt(0, height),
  };
}
