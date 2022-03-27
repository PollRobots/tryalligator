export interface Point {
  x: number;
  y: number;
}

export interface IndexedPoint extends Point {
  i: number;
}

export function applySnap<T extends Point>(points: T[], snap: number): T[] {
  if (snap <= 0) {
    return points;
  }
  return points.map((p) => ({
    ...p,
    x: Math.round(p.x / snap) * snap,
    y: Math.round(p.y / snap) * snap,
  }));
}
