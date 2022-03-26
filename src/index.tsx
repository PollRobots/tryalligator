import * as React from "react";
import * as ReactDOM from "react-dom";

import { DotBox } from "./components/DotBox";

ReactDOM.render(
  <div>
    <h1>Try Alligator</h1>
    <DotBox width={512} height={512} />
  </div>,
  document.getElementById("app")
);
