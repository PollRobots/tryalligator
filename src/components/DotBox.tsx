import React from "react";
import { applySymmetry } from "./symmetry";
import { applySnap, Point } from "./Point";

interface DotBoxProps {
  imageData?: ImageData;
  width: number;
  height: number;
  symmetry: number;
  snap: number;
  onUpdatePoints?: (points: Point[]) => void;
}

export const DotBox: React.FunctionComponent<DotBoxProps> = (
  props: DotBoxProps
) => {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = React.useState<Point[]>([]);
  const [selected, setSelected] = React.useState<number>(-1);

  const updatePoints = (updated: Point[]) => {
    setPoints(updated);
    if (props.onUpdatePoints) {
      props.onUpdatePoints(updated);
    }
  };

  const getSvgPoint = (evt: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) {
      return;
    }
    const svgCtm = svg.getScreenCTM();
    if (!svgCtm) {
      return;
    }
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;

    return pt.matrixTransform(svgCtm.inverse());
  };

  const onSvgClick = (evt: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const svgP = getSvgPoint(evt);
    if (!svgP) {
      return;
    }
    updatePoints([...points, { x: svgP.x, y: svgP.y }]);
  };

  const onMouseDown = (
    evt: React.MouseEvent<SVGCircleElement, MouseEvent>,
    i: number
  ) => {
    setSelected(i);
  };

  const onMouseMove = (evt: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (selected === -1 || evt.buttons === 0) {
      return;
    }
    const svgP = getSvgPoint(evt);
    if (!svgP) {
      return;
    }
    const updated = [...points];
    updated[selected] = { x: svgP.x, y: svgP.y };
    updatePoints(updated);
  };

  const onMouseUp = (
    evt: React.MouseEvent<SVGCircleElement, MouseEvent>,
    i: number
  ) => {
    setSelected(-1);
  };

  const symPoints = applySymmetry(
    points,
    props.width,
    props.height,
    props.symmetry
  );

  const snapped = applySnap(symPoints, props.snap);

  React.useEffect(() => {
    if (!props.imageData || !canvasRef.current) {
      return;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.putImageData(props.imageData, 0, 0);
  }, [props.imageData]);

  return (
    <div
      style={{
        display: "grid",
        border: "solid 1px #888",
        width: "fit-content",
      }}
    >
      <canvas
        style={{ gridRowStart: 1, gridColumnStart: 1 }}
        width={props.width}
        height={props.height}
        ref={canvasRef}
      />
      <svg
        style={{ gridRowStart: 1, gridColumnStart: 1 }}
        ref={svgRef}
        width={props.width}
        height={props.height}
        viewBox={`0 0 ${props.width} ${props.height}`}
        onClick={(e) => onSvgClick(e)}
        onMouseMove={(e) => onMouseMove(e)}
      >
        {snapped.map((p, i) => (
          <circle
            cx={p.x}
            cy={p.y}
            r={selected === p.i ? 8 : 4}
            key={i}
            fill="transparent"
            stroke="black"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => onMouseDown(e, p.i)}
            onMouseUp={(e) => onMouseUp(e, p.i)}
          />
        ))}
      </svg>
    </div>
  );
};
