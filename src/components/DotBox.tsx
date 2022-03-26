import React from "react";

interface DotBoxProps {
  width: number;
  height: number;
  onUpdatePoints?: (points: DotBoxPoint[]) => void;
}

interface DotBoxPoint {
  x: number;
  y: number;
}

export const DotBox: React.FunctionComponent<DotBoxProps> = (
  props: DotBoxProps
) => {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [points, setPoints] = React.useState<DotBoxPoint[]>([]);
  const [selected, setSelected] = React.useState<number>(-1);

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
    setPoints([...points, { x: svgP.x, y: svgP.y }]);
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
    setPoints(updated);
  };

  const onMouseUp = (
    evt: React.MouseEvent<SVGCircleElement, MouseEvent>,
    i: number
  ) => {
    setSelected(-1);
  };

  return (
    <div style={{ border: "solid 1px #888", width: "fit-content" }}>
      <svg
        ref={svgRef}
        width={props.width}
        height={props.height}
        viewBox={`0 0 ${props.width} ${props.height}`}
        onClick={(e) => onSvgClick(e)}
        onMouseMove={(e) => onMouseMove(e)}
      >
        {points.map((p, i) => (
          <circle
            cx={p.x}
            cy={p.y}
            r={selected === i ? 8 : 4}
            key={i}
            fill="transparent"
            stroke="black"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => onMouseDown(e, i)}
            onMouseUp={(e) => onMouseUp(e, i)}
          />
        ))}
      </svg>
    </div>
  );
};
