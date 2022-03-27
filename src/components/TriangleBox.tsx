import React from "react";
import Delaunator from "delaunator";
import { applySymmetry } from "./symmetry";
import { applySnap, IndexedPoint, Point } from "./Point";

interface TriangleBoxProps {
  width: number;
  height: number;
  symmetry: number;
  snap: number;
  points: Point[];
}

export const TriangleBox: React.FC<TriangleBoxProps> = (
  props: TriangleBoxProps
) => {
  const symPoints = applySymmetry(
    props.points,
    props.width,
    props.height,
    props.symmetry
  );
  const snapped = applySnap(symPoints, props.snap);
  const triangles = Delaunator.from(
    snapped,
    (p: IndexedPoint) => p.x,
    (p: IndexedPoint) => p.y
  ).triangles;
  const vertices: number[][] = [];
  for (let i = 0; i < triangles.length; i += 3) {
    vertices.push([triangles[i], triangles[i + 1], triangles[i + 2]]);
  }
  return (
    <div style={{ border: "solid 1px #888", width: "fit-content" }}>
      <svg
        width={props.width}
        height={props.height}
        viewBox={`0 0 ${props.width} ${props.height}`}
      >
        {vertices.map((t, i) => (
          <Triangle key={i} vertices={t} points={snapped} />
        ))}
      </svg>
    </div>
  );
};

interface TriangleProps {
  vertices: number[];
  points: Point[];
}

const Triangle: React.FC<TriangleProps> = (props: TriangleProps) => {
  const points = props.vertices.map((i) => props.points[i]);
  return (
    <polygon
      points={points.map((p) => `${p.x},${p.y}`).join(" ")}
      fill="none"
      stroke="black"
    />
  );
};
