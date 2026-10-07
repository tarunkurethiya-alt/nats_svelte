import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBrush } from '../../domain/entities/brush';
import type { BoardEvent } from '../../domain/entities/board-event';
import type { IBoardEventRepository } from '../../domain/repositories/board-event.repository';
import { WhiteboardUseCases } from '../../domain/usecases/whiteboard.usecases';
import { whiteboardStore, type BoardView } from './whiteboard.store.svelte';

const brush = createBrush('#000000', 4);

function setup() {
	let remote: ((event: BoardEvent) => void) | undefined;
	const published: BoardEvent[] = [];
	const repo: IBoardEventRepository = {
		publish: (event) => void published.push(event),
		subscribe: (handler) => {
			remote = handler;
			return () => (remote = undefined);
		}
	};
	const view: BoardView = { drawSegment: vi.fn(), clear: vi.fn() };

	whiteboardStore.init(new WhiteboardUseCases(repo, 'me'));
	whiteboardStore.setConnected(true);

	return { view, published, receive: (event: BoardEvent) => remote?.(event) };
}

describe('whiteboardStore', () => {
	beforeEach(() => whiteboardStore.reset());

	it('draws a dot on beginStroke and publishes it', () => {
		const { view, published } = setup();
		whiteboardStore.bindView(view);

		whiteboardStore.beginStroke({ x: 0.5, y: 0.5 }, brush);

		expect(view.drawSegment).toHaveBeenCalledTimes(1);
		expect(published).toHaveLength(1);
	});

	it('connects consecutive points into segments until the stroke ends', () => {
		const { view, published } = setup();
		whiteboardStore.bindView(view);

		whiteboardStore.beginStroke({ x: 0, y: 0 }, brush);
		whiteboardStore.continueStroke({ x: 1, y: 1 }, brush);
		whiteboardStore.endStroke();
		whiteboardStore.continueStroke({ x: 0.5, y: 0.5 }, brush);

		expect(published).toHaveLength(2);
	});

	it('ignores input while disconnected', () => {
		const { view, published } = setup();
		whiteboardStore.bindView(view);
		whiteboardStore.setConnected(false);

		whiteboardStore.beginStroke({ x: 0, y: 0 }, brush);
		whiteboardStore.clearBoard();

		expect(view.drawSegment).not.toHaveBeenCalled();
		expect(published).toHaveLength(0);
	});

	it('clears locally and publishes a clear event', () => {
		const { view, published } = setup();
		whiteboardStore.bindView(view);

		whiteboardStore.clearBoard();

		expect(view.clear).toHaveBeenCalledTimes(1);
		expect(published).toEqual([{ type: 'clear', userId: 'me' }]);
	});

	it("applies other users' events but not our own", () => {
		const { view, receive } = setup();
		whiteboardStore.bindView(view);
		const segment = { from: { x: 0, y: 0 }, to: { x: 1, y: 1 }, brush };

		receive({ type: 'draw', userId: 'someone-else', segment });
		receive({ type: 'draw', userId: 'me', segment });
		receive({ type: 'clear', userId: 'someone-else' });

		expect(view.drawSegment).toHaveBeenCalledTimes(1);
		expect(view.clear).toHaveBeenCalledTimes(1);
	});

	it('stops applying remote events after unbinding', () => {
		const { view, receive } = setup();
		const unbind = whiteboardStore.bindView(view);

		unbind();
		receive({ type: 'clear', userId: 'someone-else' });

		expect(view.clear).not.toHaveBeenCalled();
	});
});
