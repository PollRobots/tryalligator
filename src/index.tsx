import React from "react";
import ReactDOM, { render } from "react-dom";
import { renderToString } from "react-dom/server";

import { DotBox } from "./components/DotBox";
import { TriangleBox } from "./components/TriangleBox";

const kSymmetry = ["None", "Horizontal", "Vertical", "Both"];

const App: React.FC = () => {
  const [points, setPoints] = React.useState<{ x: number; y: number }[]>([]);
  const [snap, setSnap] = React.useState<number>(0);
  const [symmetry, setSymmetry] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [image, setImage] = React.useState<{
    data?: ImageData;
    name?: string;
    width: number;
    height: number;
  }>({ width: 512, height: 512 });

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

  const saveImage = () => {
    if (!image.name) {
      return;
    }
    const core = renderToString(
      <TriangleBox
        imageData={image.data}
        width={image.width}
        height={image.height}
        snap={snap}
        points={points}
        symmetry={symmetry}
        svgGroupOnly={true}
      />
    );
    const link = document.createElement("a");
    const last = image.name.lastIndexOf(".");
    const basename = last > 0 ? image.name.substring(0, last) : image.name;
    link.setAttribute("download", `${basename}.tryalligatored.svg`);
    const blob = new Blob(
      [
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n',
        '<svg xmlns="http://www.w3.org/2000/svg"',
        ' xmlns:xlink="http://www.w3.org/1999/xlink"',
        ` width="${image.width / 96}in" height="${image.height / 96}in"`,
        ` viewBox="0 0 ${image.width} ${image.height}">\n`,
        core,
        "\n</svg>",
      ],
      { type: "image/svg+xml" }
    );
    link.href = URL.createObjectURL(blob);

    link.click();
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
        />
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
            width={image.width}
            height={image.height}
            snap={snap}
            symmetry={symmetry}
            onUpdatePoints={(pts) => setPoints(pts)}
          />
        </div>
        <div>
          <TriangleBox
            imageData={image.data}
            width={image.width}
            height={image.height}
            snap={snap}
            points={points}
            symmetry={symmetry}
          />
        </div>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById("app"));
