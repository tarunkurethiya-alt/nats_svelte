export const MIN_BRUSH_WIDTH = 1;
export const MAX_BRUSH_WIDTH = 20;

export interface Brush {
	readonly color: string;
	readonly width: number;
}

export function createBrush(color: string, width: number): Brush {
	return {
		color,
		width: Math.min(MAX_BRUSH_WIDTH, Math.max(MIN_BRUSH_WIDTH, width))
	};
}
