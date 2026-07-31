import { describe, expect, it } from 'vitest';
import {
  BIA_STROKE,
  BIA_VIEWBOX,
  MAKRUK_STROKE_RATIO,
  makrukStrokeForViewBox,
} from '../lib/makrukStroke';

describe('makrukStroke', () => {
  it('locks Bia stroke to 20/360 (1/18)', () => {
    expect(BIA_STROKE).toBe(20);
    expect(BIA_VIEWBOX).toBe(360);
    expect(MAKRUK_STROKE_RATIO).toBeCloseTo(1 / 18);
  });

  it('scales stroke with icon viewBox', () => {
    expect(makrukStrokeForViewBox(80)).toBeCloseTo(80 / 18);
    expect(makrukStrokeForViewBox(360)).toBe(20);
  });
});
