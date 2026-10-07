/**
 * A position on the board, normalized to 0..1 on each axis so that it is
 * independent of the size of whatever surface renders the board.
 */
export interface Point {
	readonly x: number;
	readonly y: number;
}
