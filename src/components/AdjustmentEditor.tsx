import React from "react";

export interface Adjustment {
  apply: boolean;
  whitePoint: number;
  blackPoint: number;
  saturationFactor: number;
}

interface AdjustmentEditorProps extends Adjustment {
  onChange?: (updated: Adjustment) => void;
}

export const AdjustmentEditor: React.FunctionComponent<
  AdjustmentEditorProps
> = (props: AdjustmentEditorProps) => {
  const update = (update: Partial<Adjustment>) => {
    if (props.onChange) {
      props.onChange({ ...props, ...update });
    }
  };
  return (
    <div>
      <label htmlFor="chkApply">Adjust Image: </label>
      <input
        id="chkApply"
        type="checkbox"
        checked={props.apply}
        onClick={() => update({ apply: !props.apply })}
      />
      {props.apply ? <AdjustmentEditorInner {...props} /> : null}
    </div>
  );
};

const AdjustmentEditorInner: React.FC<AdjustmentEditorProps> = (
  props: AdjustmentEditorProps
) => {
  const update = (update: Partial<Adjustment>) => {
    if (props.onChange) {
      props.onChange({ ...props, ...update });
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        columnGap: "0.5em",
        rowGap: "0.5em",
        width: "fit-content",
        margin: "0.5em 0",
      }}
    >
      <div>White point:</div>
      <div>
        <input
          type="range"
          value={props.whitePoint}
          min={0}
          max={255}
          step={1}
          onChange={(e) => update({ whitePoint: e.target.valueAsNumber })}
        />{" "}
        {props.whitePoint}
      </div>

      <div>Black point:</div>
      <div>
        <input
          type="range"
          value={props.blackPoint}
          min={0}
          max={255}
          step={1}
          onChange={(e) => update({ blackPoint: e.target.valueAsNumber })}
        />{" "}
        {props.blackPoint}
      </div>

      <div>Saturation:</div>
      <div>
        <input
          type="range"
          value={props.saturationFactor}
          min={-100}
          max={100}
          step={1}
          list="tickmarks"
          onChange={(e) => update({ saturationFactor: e.target.valueAsNumber })}
        />{" "}
        {props.saturationFactor}%
        <datalist id="tickmarks">
          <option value="-100" />
          <option value="-90" />
          <option value="-80" />
          <option value="-70" />
          <option value="-60" />
          <option value="-50" />
          <option value="-40" />
          <option value="-30" />
          <option value="-20" />
          <option value="-10" />
          <option value="0" />
          <option value="10" />
          <option value="20" />
          <option value="30" />
          <option value="40" />
          <option value="50" />
          <option value="60" />
          <option value="70" />
          <option value="80" />
          <option value="90" />
          <option value="100" />
        </datalist>
      </div>
    </div>
  );
};
