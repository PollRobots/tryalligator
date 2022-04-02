import convert from "color-convert";

export interface Color {
  r: number;
  g: number;
  b: number;
}

export function adjustColor(
  color: Color,
  whitePoint: number,
  blackPoint: number,
  saturation: number
): Color {
  const adjusted = { ...color };
  if (whitePoint < 255 || blackPoint > 0) {
    const scale = 255 / (whitePoint - blackPoint);
    adjusted.r = Math.min(
      Math.max(0, Math.round(scale * (adjusted.r - blackPoint))),
      255
    );
    adjusted.g = Math.min(
      Math.max(0, Math.round(scale * (adjusted.g - blackPoint))),
      255
    );
    adjusted.b = Math.min(
      Math.max(0, Math.round(scale * (adjusted.b - blackPoint))),
      255
    );
  }

  if (saturation) {
    const hsl = convert.rgb.hsl(adjusted.r, adjusted.g, adjusted.b);

    hsl[1] =
      saturation > 0
        ? (hsl[1] * (100 - saturation) + 100 * saturation) / 100
        : (hsl[1] * (saturation + 100)) / 100;

    const rgb = convert.hsl.rgb(hsl);
    adjusted.r = rgb[0];
    adjusted.g = rgb[1];
    adjusted.b = rgb[2];
  }

  return adjusted;
}
