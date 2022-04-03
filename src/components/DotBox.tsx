import React from "react";
import { applySymmetry } from "./symmetry";
import { applySnap, Point } from "./point";

interface DotBoxProps {
  imageData?: ImageData;
  points: Point[];
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
  const [selected, setSelected] = React.useState<number>(-1);

  const updatePoints = (updated: Point[]) => {
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
    updatePoints([...props.points, { x: svgP.x, y: svgP.y }]);
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
    const updated = [...props.points];
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
    props.points,
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

  const pointColor = (point: Point, r: number): string => {
    if (!props.imageData) {
      return "#000000";
    }

    const cx = Math.round(point.x);
    const cy = Math.round(point.y);

    let x = 0;
    let y = r;
    let e = 0;
    const limit = r;

    const sum = { r: 0, g: 0, b: 0, count: 0 };

    const accum = (lowx: number, highx: number, y: number) => {
      if (!props.imageData) {
        return;
      }
      const yOff = y * props.width * 4;
      for (let x = lowx; x <= highx; x++) {
        const i = yOff + x * 4;
        sum.r += props.imageData.data[i];
        sum.g += props.imageData.data[i + 1];
        sum.b += props.imageData.data[i + 2];
        sum.count++;
      }
    };

    while (y >= x) {
      if (e >= limit) {
        e += 1 - 2 * y;
        accum(cx - x, cx + x, cy + y);
        accum(cx - x, cx + x, cy - y);
        y--;
      } else {
        e += 2 * x + 1;
        accum(cy - y, cy + y, cx + x);
        accum(cy - y, cy + y, cx - x);
        x++;
      }
    }

    if (!sum.count) {
      return "#000000";
    }

    const avg_r = Math.round(sum.r / sum.count) / 255;
    const avg_g = Math.round(sum.g / sum.count) / 255;
    const avg_b = Math.round(sum.b / sum.count) / 255;

    const cmax = Math.max(avg_r, avg_g, avg_b);
    const cmin = Math.min(avg_r, avg_g, avg_b);
    const delta = cmax - cmin;
    const lum = (cmax + cmin) / 2;
    const sat = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lum - 1));
    if (sat < 0.25) {
      return "#ff00ff";
    } else if (lum > 0.5) {
      return "#000000";
    } else {
      return "#ffffff";
    }
  };

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
            stroke={pointColor(p, 4)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => onMouseDown(e, p.i)}
            onMouseUp={(e) => onMouseUp(e, p.i)}
          />
        ))}
      </svg>
    </div>
  );
};
