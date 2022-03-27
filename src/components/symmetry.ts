export function applySymmetry(
  points: { x: number; y: number }[],
  width: number,
  height: number,
  symmetry: number
) {
  const result: { x: number; y: number; i: number }[] = [];
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    result.push({ ...point, i: i });
    switch (symmetry) {
      case 1:
        result.push({ x: width - point.x, y: point.y, i: i });
        break;
      case 2:
        result.push({ x: point.x, y: height - point.y, i: i });
        break;
      case 3:
        result.push({ x: width - point.x, y: point.y, i: i });
        result.push({ x: point.x, y: height - point.y, i: i });
        result.push({ x: width - point.x, y: height - point.y, i: i });
        break;
    }
  }
  return result;
}
