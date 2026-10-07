import type { Brush } from './brush';
import type { Point } from './point';

/** A straight piece of a stroke, drawn with a single brush. */
export interface Segment {
	readonly from: Point;
	readonly to: Point;
	readonly brush: Brush;
}
