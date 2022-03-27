import * as React from "react";
import * as ReactDOM from "react-dom";

import { DotBox } from "./components/DotBox";
import { TriangleBox } from "./components/TriangleBox";

const kSymmetry = ["None", "Horizontal", "Vertical", "Both"];

const App: React.FC = () => {
  const [points, setPoints] = React.useState<{ x: number; y: number }[]>([]);
  const [snap, setSnap] = React.useState<number>(0);
  const [symmetry, setSymmetry] = React.useState<number>(0);

  return (
    <div style={{ display: "grid", rowGap: "0.5em" }}>
      <h1>Try Alligator</h1>
      <div>
        Symmetry:{" "}
        <select
          value={symmetry}
          onChange={(e) => setSymmetry(Number(e.target.value))}
        >
          <option value={0}>None</option>
          <option value={1}>Horizontal</option>
          <option value={2}>Vertical</option>
          <option value={3}>Both</option>
        </select>{" "}
        Snap:{" "}
        <input
          type="number"
          min={0}
          max={32}
          step={1}
          value={snap}
          onChange={(e) => setSnap(Number(e.target.value))}
        />
      </div>
      <div>
        <DotBox
          width={512}
          height={512}
          snap={snap}
          symmetry={symmetry}
          onUpdatePoints={(pts) => setPoints(pts)}
        />
      </div>
      <div>
        <TriangleBox
          width={512}
          height={512}
          snap={snap}
          points={points}
          symmetry={symmetry}
        />
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("app"));
