/** Bia (เบี้ย) stroke lock — ADR 0002. viewBox 360, stroke-width 20 → 1/18. */
export const BIA_VIEWBOX = 360;
export const BIA_STROKE = 20;
export const MAKRUK_STROKE_RATIO = BIA_STROKE / BIA_VIEWBOX;

export function makrukStrokeForViewBox(viewBoxSize: number): number {
  return viewBoxSize * MAKRUK_STROKE_RATIO;
}

export function makrukCornerRadius(viewBoxSize: number): number {
  return makrukStrokeForViewBox(viewBoxSize);
}
