import {
	createClearEvent,
	createDrawEvent,
	type BoardEvent,
	type UserId
} from '$lib/domain/board-event';
import type { Brush } from '$lib/domain/brush';
import type { Point } from '$lib/domain/point';
import type { Segment } from '$lib/domain/segment';
import type { BoardEventBus, Unsubscribe } from './ports/board-event-bus';
import type { BoardRenderer } from './ports/board-renderer';

export type WhiteboardDeps = {
	userId: UserId;
	bus: BoardEventBus;
	renderer: BoardRenderer;
};

export class WhiteboardService {
	readonly #userId: UserId;
	readonly #bus: BoardEventBus;
	readonly #renderer: BoardRenderer;
	#lastPoint: Point | null = null;

	constructor({ userId, bus, renderer }: WhiteboardDeps) {
		this.#userId = userId;
		this.#bus = bus;
		this.#renderer = renderer;
	}

	beginStroke(point: Point, brush: Brush): void {
		this.#lastPoint = point;

		// Draw a dot even if the pointer doesn't move.
		this.#drawSegment(point, point, brush);
	}

	continueStroke(point: Point, brush: Brush): void {
		if (!this.#lastPoint) return;

		this.#drawSegment(this.#lastPoint, point, brush);
		this.#lastPoint = point;
	}

	endStroke(): void {
		this.#lastPoint = null;
	}

	clearBoard(): void {
		this.#renderer.clear();
		this.#bus.publish(createClearEvent(this.#userId));
	}

	/** Starts applying events published by other users to the local board. */
	listen(): Unsubscribe {
		return this.#bus.subscribe((event) => this.#applyRemoteEvent(event));
	}

	#drawSegment(from: Point, to: Point, brush: Brush): void {
		const segment: Segment = { from, to, brush };

		// Render locally immediately, then share with everyone else.
		this.#renderer.drawSegment(segment);
		this.#bus.publish(createDrawEvent(this.#userId, segment));
	}

	#applyRemoteEvent(event: BoardEvent): void {
		// We already rendered our own events.
		if (event.userId === this.#userId) return;

		switch (event.type) {
			case 'draw':
				this.#renderer.drawSegment(event.segment);
				break;
			case 'clear':
				this.#renderer.clear();
				break;
		}
	}
}
