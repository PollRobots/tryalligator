import React from "react";
import { IndexedPoint, Point } from "./point";
import { Triangle } from "./Triangle";

interface DotBoxProps {
  imageData?: ImageData;
  points: Point[];
  snapped: IndexedPoint[];
  width: number;
  height: number;
  triangles: Uint32Array;
  showTriangles?: boolean;
  onUpdatePoints?: (points: Point[]) => void;
}

export const DotBox: React.FunctionComponent<DotBoxProps> = (
  props: DotBoxProps
) => {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = React.useState<number>(-1);
  const [zoom, setZoom] = React.useState<{
    factor: number;
    x: number;
    y: number;
  }>({ factor: 1, x: 0, y: 0 });

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
    if (evt.ctrlKey) {
      if (zoom.factor > 1 && svgRef.current) {
        const factor = Math.max(1, zoom.factor - 0.5);
        if (factor == 1) {
          setZoom({ factor: 1, x: 0, y: 0 });
        } else {
          const bounds = svgRef.current.getBoundingClientRect();
          const offsetX = evt.clientX - bounds.left;
          const offsetY = evt.clientY - bounds.top;

          // ? / factor + offset / factor = svgP * oldFactor
          // ? = factor * (svgP * oldFactor - offset / factor)
          setZoom({
            factor: factor,
            x: factor * (svgP.x - offsetX / factor),
            y: factor * (svgP.y - offsetY / factor),
          });
        }
      }
    } else if (evt.shiftKey) {
      if (zoom.factor < 10 && svgRef.current) {
        const factor = Math.min(10, zoom.factor + 0.5);

        const bounds = svgRef.current.getBoundingClientRect();
        const offsetX = evt.clientX - bounds.left;
        const offsetY = evt.clientY - bounds.top;

        // ? / factor + offset / factor = svgP
        // ? = factor * (svgP - offset / factor)

        setZoom({
          factor: factor,
          x: factor * (svgP.x - offsetX / factor),
          y: factor * (svgP.y - offsetY / factor),
        });
      }
    } else {
      updatePoints([...props.points, { x: svgP.x, y: svgP.y }]);
    }
    evt.preventDefault();
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

  React.useEffect(() => {
    if (!props.imageData || !canvasRef.current) {
      return;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) {
      return;
    }
    const temp = document.createElement("canvas");
    temp.width = props.width;
    temp.height = props.height;
    temp.getContext("2d")?.putImageData(props.imageData, 0, 0);
    ctx.drawImage(
      temp,
      zoom.x / zoom.factor,
      zoom.y / zoom.factor,
      props.width / zoom.factor,
      props.height / zoom.factor,
      0,
      0,
      props.width,
      props.height
    );
  }, [props.imageData, zoom.factor]);

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

  const core: React.ReactNode[] = [];
  if (props.showTriangles) {
    const vertices: number[][] = [];
    for (let i = 0; i < props.triangles.length; i += 3) {
      vertices.push([
        props.triangles[i],
        props.triangles[i + 1],
        props.triangles[i + 2],
      ]);
    }
    vertices.forEach((t, i) =>
      core.push(
        <Triangle
          key={i}
          vertices={t}
          points={props.points}
          width={props.width}
        />
      )
    );
  }

  return (
    <div
      style={{
        display: "grid",
        border: "solid 1px #888",
        width: "fit-content",
        cursor: "crosshair",
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
        viewBox={`${zoom.x / zoom.factor} ${zoom.y / zoom.factor} ${
          props.width / zoom.factor
        } ${props.height / zoom.factor}`}
        onClick={(e) => onSvgClick(e)}
        onMouseMove={(e) => onMouseMove(e)}
      >
        <g transform="scale(0.1)" strokeWidth={10 / zoom.factor}>
          {core}
        </g>
        <g strokeWidth={1 / zoom.factor}>
          {props.snapped.map((p, i) => (
            <circle
              cx={p.x}
              cy={p.y}
              r={(selected === p.i ? 8 : 4) / zoom.factor}
              key={i}
              fill="transparent"
              stroke={pointColor(p, 4)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => onMouseDown(e, p.i)}
              onMouseUp={(e) => onMouseUp(e, p.i)}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};
