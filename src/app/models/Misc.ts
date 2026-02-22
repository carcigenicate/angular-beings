export class Position {
  constructor(
    public x: number,
    public y: number,
  ) {
  }

  inWithin(xMin: number, xMax: number, yMin: number, yMax: number): boolean {
    return this.x >= xMin && this.x <= xMax
        && this.y >= yMin && this.y <= yMax;
  }
}
