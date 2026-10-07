import type { BoardRenderer } from '$lib/application/ports/board-renderer';
import type { Point } from '$lib/domain/point';
import type { Segment } from '$lib/domain/segment';

/** BoardRenderer that draws onto an HTML canvas. */
export class CanvasBoardRenderer implements BoardRenderer {
	readonly #canvas: HTMLCanvasElement;
	readonly #ctx: CanvasRenderingContext2D;

	constructor(canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('2D canvas context is not supported');

		this.#canvas = canvas;
		this.#ctx = ctx;
	}

	/** Converts viewport coordinates into a normalized board point. */
	toBoardPoint(clientX: number, clientY: number): Point {
		const rect = this.#canvas.getBoundingClientRect();

		return {
			x: (clientX - rect.left) / rect.width,
			y: (clientY - rect.top) / rect.height
		};
	}

	drawSegment(segment: Segment): void {
		const ctx = this.#ctx;
		const { width, height } = this.#canvas;

		ctx.beginPath();
		ctx.strokeStyle = segment.brush.color;
		ctx.lineWidth = segment.brush.width;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.moveTo(segment.from.x * width, segment.from.y * height);
		ctx.lineTo(segment.to.x * width, segment.to.y * height);
		ctx.stroke();
	}

	clear(): void {
		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
	}
}
