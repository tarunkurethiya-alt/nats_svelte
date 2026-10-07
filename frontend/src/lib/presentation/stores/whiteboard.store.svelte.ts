import type { Brush } from '../../domain/entities/brush';
import type { Point } from '../../domain/entities/point';
import type { Segment } from '../../domain/entities/segment';
import type { Unsubscribe } from '../../domain/repositories/board-event.repository';
import type { WhiteboardUseCases } from '../../domain/usecases/whiteboard.usecases';
import { requireInit } from './guard';

/** Whatever surface the board is drawn on. */
export interface BoardView {
	drawSegment(segment: Segment): void;
	clear(): void;
}

let useCases: WhiteboardUseCases | undefined;
const uc = () => requireInit(useCases, 'whiteboardStore');

let connected = $state(false);
let view: BoardView | null = null;
let lastPoint: Point | null = null;

function drawSegment(from: Point, to: Point, brush: Brush): void {
	const segment: Segment = { from, to, brush };

	// Render locally immediately, then share with everyone else.
	view?.drawSegment(segment);
	uc().shareSegment(segment);
}

export const whiteboardStore = {
	init(u: WhiteboardUseCases) {
		useCases = u;
	},

	get connected() {
		return connected;
	},

	setConnected(value: boolean) {
		connected = value;
	},

	/** Draws onto `v` and applies other users' events to it, until the returned function is called. */
	bindView(v: BoardView): Unsubscribe {
		view = v;

		const unsubscribe = useCases?.subscribeToRemoteEvents((event) => {
			switch (event.type) {
				case 'draw':
					v.drawSegment(event.segment);
					break;
				case 'clear':
					v.clear();
					break;
			}
		});

		return () => {
			unsubscribe?.();
			if (view === v) view = null;
		};
	},

	beginStroke(point: Point, brush: Brush) {
		if (!connected || !view) return;

		lastPoint = point;
		// Draw a dot even if the pointer doesn't move.
		drawSegment(point, point, brush);
	},

	continueStroke(point: Point, brush: Brush) {
		if (!connected || !view || !lastPoint) return;

		drawSegment(lastPoint, point, brush);
		lastPoint = point;
	},

	endStroke() {
		lastPoint = null;
	},

	clearBoard() {
		if (!connected || !view) return;

		view.clear();
		uc().shareClear();
	},

	reset() {
		useCases = undefined;
		view = null;
		lastPoint = null;
		connected = false;
	}
};
