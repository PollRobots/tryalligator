import Delaunator from "delaunator";
import React from "react";
import ReactDOM, { render } from "react-dom";
import { renderToString } from "react-dom/server";
import { Adjustment, AdjustmentEditor } from "./components/AdjustmentEditor";

import { DotBox } from "./components/DotBox";
import { applySnap, IndexedPoint } from "./components/point";
import { applySymmetry } from "./components/symmetry";
import { TriangleBox } from "./components/TriangleBox";

const kSymmetry = ["None", "Horizontal", "Vertical", "Both"];

interface Image {
  data?: ImageData;
  name?: string;
  width: number;
  height: number;
}

const kEmptyImage: Image = { width: 512, height: 512 };

const kEmptyAdjustment: Adjustment = {
  apply: false,
  whitePoint: 255,
  blackPoint: 0,
  saturationFactor: 0,
};

const App: React.FC = () => {
  const [points, setPoints] = React.useState<{ x: number; y: number }[]>([]);
  const [snap, setSnap] = React.useState<number>(0);
  const [symmetry, setSymmetry] = React.useState<number>(0);
  const [showTriangles, setShowTriangles] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [image, setImage] = React.useState<Image>(kEmptyImage);
  const [adjust, setAdjust] = React.useState<Adjustment>(kEmptyAdjustment);

  const symPoints = applySymmetry(points, image.width, image.height, symmetry);
  const snapped = applySnap(symPoints, snap);
  const triangles = Delaunator.from(
    snapped,
    (p) => p.x,
    (p) => p.y
  ).triangles;

  const selectImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", (e) => {
      if (input.files && input.files.length > 0) {
        setLoading(true);
        fileSelected(input.files[0]);
      }
    });
    input.click();
  };

  const fileSelected = (file: File) => {
    const reader = new FileReader();
    reader.addEventListener("load", (e: ProgressEvent<FileReader>) => {
      const img = document.createElement("img");
      img.addEventListener("load", (e) => onImageLoad(file, img));
      img.addEventListener("error", (e) => {
        console.error(`Unable to load and render ${file.name}: ${e}`);
        setLoading(false);
      });
      img.src = reader.result as string;
    });
    reader.addEventListener("error", (e) => {
      console.error(`Unable to load ${file.name}: ${e}`);
      setLoading(false);
    });
    reader.readAsDataURL(file);
  };

  const onImageLoad = (file: File, img: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    if (img.naturalWidth * img.naturalHeight > 1024 * 1024) {
      const scale = Math.sqrt(
        (1024 * 1024) / (img.naturalWidth * img.naturalHeight)
      );
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
    } else {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.drawImage(
      img,
      0,
      0,
      img.naturalWidth,
      img.naturalHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setImage({
      data: imageData,
      name: file.name,
      width: canvas.width,
      height: canvas.height,
    });
    setLoading(false);
  };

  const saveImage = async () => {
    if (!image.name) {
      return;
    }
    const core = renderToString(
      <TriangleBox
        imageData={image.data}
        width={image.width}
        height={image.height}
        points={snapped}
        adjust={adjust}
        triangles={triangles}
        svgGroupOnly={true}
      />
    );
    const last = image.name.lastIndexOf(".");
    const basename = last > 0 ? image.name.substring(0, last) : image.name;
    const filename = `${basename}.tryalligatored.svg`;
    const blob = new Blob(
      [
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n',
        '<svg xmlns="http://www.w3.org/2000/svg"',
        ' xmlns:xlink="http://www.w3.org/1999/xlink"',
        ` width="${image.width / 96}in" height="${image.height / 96}in"`,
        ` viewBox="0 0 ${image.width * 10} ${image.height * 10}">\n`,
        core,
        "\n</svg>",
      ],
      { type: "image/svg+xml" }
    );

    if (Reflect.has(window, "showSaveFilePicker")) {
      const handle = await showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: "SVG files",
            accept: { "image/svg+xml": [".svg"] },
          },
        ],
      });
      const writeable = await handle.createWritable();
      await writeable.write(blob);
      await writeable.close();
    } else {
      const link = document.createElement("a");
      link.setAttribute("download", filename);
      link.href = URL.createObjectURL(blob);

      link.click();
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          gridTemplateColumns: "auto 1fr",
          columnGap: "1em",
        }}
      >
        <img
          src="assets/tryalligator.icon.svg"
          alt="Try Alligator"
          style={{ height: "5em" }}
        />
        <h1>Try Alligator</h1>
      </div>
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
        />{" "}
        <label htmlFor="chkShowTriangles">Show Triangles: </label>
        <input
          type="checkbox"
          checked={showTriangles}
          onClick={() => setShowTriangles(!showTriangles)}
          id="chkShowTriangles"
        />{" "}
        <button
          style={{ width: "8em", height: "2em", margin: "0.5em" }}
          onClick={() => selectImage()}
          disabled={loading}
        >
          {loading ? "Loading..." : "Select Image"}
        </button>
        <button
          style={{ width: "8em", height: "2em", margin: "0.5em" }}
          onClick={() => saveImage()}
          disabled={!image.data || points.length < 3}
        >
          Save Image
        </button>
        <button
          style={{ width: "8em", height: "2em", margin: "0.5em" }}
          onClick={() => setPoints([])}
          disabled={!points.length}
        >
          Clear Points
        </button>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          rowGap: "0.5em",
          columnGap: "0.5em",
        }}
      >
        <div>
          <DotBox
            imageData={image.data}
            points={points}
            snapped={snapped}
            width={image.width}
            height={image.height}
            triangles={triangles}
            showTriangles={showTriangles}
            onUpdatePoints={(pts) => setPoints(pts)}
          />
        </div>
        <div>
          <TriangleBox
            imageData={image.data}
            width={image.width}
            height={image.height}
            points={snapped}
            adjust={adjust}
            triangles={triangles}
          />
        </div>
      </div>
      <AdjustmentEditor {...adjust} onChange={(update) => setAdjust(update)} />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("app"));
