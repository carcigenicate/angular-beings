import { Position } from '../models/Misc';

export function getClickPosition(canvas: HTMLCanvasElement, clickEvent: MouseEvent): Position {
  const bounds = canvas.getBoundingClientRect();
  const x = clickEvent.clientX - bounds.left;
  const y = clickEvent.clientY - bounds.top;

  return { x: x, y: y };
}
