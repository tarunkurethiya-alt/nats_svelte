import type { Segment } from '$lib/domain/segment';

/** Displays the board to the local user. */
export interface BoardRenderer {
	drawSegment(segment: Segment): void;
	clear(): void;
}
