import React from "react";
import { IndexedPoint, Point } from "./point";
import { WorkCache } from "./WorkCache";
import { Adjustment } from "./AdjustmentEditor";
import { adjustColor, Color } from "./color";

interface TriangleProps {
  imageData?: ImageData;
  width: number;
  vertices: number[];
  points: Point[];
  adjust?: Adjustment;
}

export const Triangle: React.FC<TriangleProps> = (props: TriangleProps) => {
  const points = props.vertices.map((i) => props.points[i]);
  let fill = "none";
  if (props.imageData) {
    fill = computeFill(points, props.imageData, props.width, props.adjust);
  }
  const scaled = points.map(
    (pt) => `${Math.round(pt.x * 10)},${Math.round(pt.y * 10)}`
  );
  return (
    <path
      d={`M ${scaled[0]} L ${scaled[1]} ${scaled[2]} Z`}
      style={{
        fill: fill,
        stroke: fill === "none" ? "black" : fill,
      }}
    />
  );
};

interface TriangleFillArgs {
  points: Point[];
  width: number;
  imageData: ImageData;
}

export const TriangleFillCache = new WorkCache(computeFillInner);

function computeFillInner({
  points,
  width,
  imageData,
}: TriangleFillArgs): Color {
  const data = { rSum: 0, gSum: 0, bSum: 0, count: 0 };

  const bottomFlatTriangle = (points: Point[]) => {
    const invSlope1 = (points[1].x - points[0].x) / (points[1].y - points[0].y);
    const invSlope2 = (points[2].x - points[0].x) / (points[2].y - points[0].y);

    let x1 = points[0].x;
    let x2 = points[0].x;

    for (let y = points[0].y; y <= points[2].y; y++) {
      if (x1 < x2) {
        for (let x = x1; x <= x2; x++) {
          const i = (Math.round(y) * width + Math.round(x)) * 4;
          data.rSum += imageData.data[i];
          data.gSum += imageData.data[i + 1];
          data.bSum += imageData.data[i + 2];
          data.count++;
        }
      } else if (x1 > x2) {
        for (let x = x2; x <= x1; x++) {
          const i = (Math.round(y) * width + Math.round(x)) * 4;
          data.rSum += imageData.data[i];
          data.gSum += imageData.data[i + 1];
          data.bSum += imageData.data[i + 2];
          data.count++;
        }
      }
      x1 += invSlope1;
      x2 += invSlope2;
    }
  };

  const topFlatTriangle = (points: Point[]) => {
    const invSlope1 = (points[2].x - points[0].x) / (points[2].y - points[0].y);
    const invSlope2 = (points[2].x - points[1].x) / (points[2].y - points[1].y);

    let x1 = points[2].x;
    let x2 = points[2].x;

    for (let y = points[2].y; y > points[0].y; y--) {
      if (x1 < x2) {
        for (let x = x1; x <= x2; x++) {
          const i = (Math.round(y) * width + Math.round(x)) * 4;
          data.rSum += imageData.data[i];
          data.gSum += imageData.data[i + 1];
          data.bSum += imageData.data[i + 2];
          data.count++;
        }
      } else if (x1 > x2) {
        for (let x = x2; x <= x1; x++) {
          const i = (Math.round(y) * width + Math.round(x)) * 4;
          data.rSum += imageData.data[i];
          data.gSum += imageData.data[i + 1];
          data.bSum += imageData.data[i + 2];
          data.count++;
        }
      }
      x1 -= invSlope1;
      x2 -= invSlope2;
    }
  };

  if (points[1].y === points[2].y) {
    bottomFlatTriangle(points);
  } else if (points[0].y === points[1].y) {
    topFlatTriangle(points);
  } else {
    const intercept = {
      x:
        points[0].x +
        ((points[1].y - points[0].y) * (points[2].x - points[0].x)) /
          (points[2].y - points[0].y),
      y: points[1].y,
    };
    bottomFlatTriangle([points[0], points[1], intercept]);
    topFlatTriangle([points[1], intercept, points[2]]);
  }

  if (data.count <= 0) {
    return { r: 0, g: 0, b: 0 };
  }

  const r = Math.round(data.rSum / data.count);
  const g = Math.round(data.gSum / data.count);
  const b = Math.round(data.bSum / data.count);
  return { r: r, g: g, b: b };
}

function computeFill(
  points: Point[],
  imageData: ImageData,
  width: number,
  adjust?: Adjustment
) {
  points.sort((a, b) => a.y - b.y);
  const color = TriangleFillCache.compute(JSON.stringify(points), {
    points: points,
    width: width,
    imageData: imageData,
  });
  if (adjust && adjust.apply) {
    const adjusted = adjustColor(
      color,
      adjust.whitePoint,
      adjust.blackPoint,
      adjust.saturationFactor
    );
    return `rgb(${adjusted.r}, ${adjusted.g}, ${adjusted.b})`;
  } else {
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }
}
