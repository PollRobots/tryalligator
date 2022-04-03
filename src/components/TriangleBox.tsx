import React from "react";
import { IndexedPoint, Point } from "./point";
import { WorkCache } from "./WorkCache";
import { Adjustment } from "./AdjustmentEditor";
import { adjustColor, Color } from "./color";
import { TriangleFillCache, Triangle } from "./Triangle";

interface TriangleBoxProps {
  imageData?: ImageData;
  width: number;
  height: number;
  points: IndexedPoint[];
  triangles: Uint32Array;
  adjust: Adjustment;
  svgGroupOnly?: boolean;
}

let gImage: ImageData;

export const TriangleBox: React.FC<TriangleBoxProps> = (
  props: TriangleBoxProps
) => {
  const vertices: number[][] = [];
  for (let i = 0; i < props.triangles.length; i += 3) {
    vertices.push([
      props.triangles[i],
      props.triangles[i + 1],
      props.triangles[i + 2],
    ]);
  }
  if (props.imageData && gImage != props.imageData) {
    gImage = props.imageData;
    TriangleFillCache.clear();
  }
  const core = vertices.map((t, i) => (
    <Triangle
      key={i}
      vertices={t}
      points={props.points}
      imageData={props.imageData}
      width={props.width}
      adjust={props.adjust}
    />
  ));
  TriangleFillCache.advance();
  if (props.svgGroupOnly) {
    return (
      <g style={{ vectorEffect: "non-scaling-stroke", strokeWidth: 3 }}>
        {core}
      </g>
    );
  }
  return (
    <div style={{ border: "solid 1px #888", width: "fit-content" }}>
      <svg
        width={props.width}
        height={props.height}
        viewBox={`0 0 ${props.width * 10} ${props.height * 10}`}
      >
        <g style={{ vectorEffect: "non-scaling-stroke", strokeWidth: 3 }}>
          {core}
        </g>
      </svg>
    </div>
  );
};
