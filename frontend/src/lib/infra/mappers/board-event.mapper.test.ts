import { describe, expect, it } from 'vitest';
import { createClearEvent, createDrawEvent } from '../../domain/entities/board-event';
import { MAX_BRUSH_WIDTH } from '../../domain/entities/brush';
import { BoardEventMapper } from './board-event.mapper';

const segment = {
	from: { x: 0.1, y: 0.2 },
	to: { x: 0.3, y: 0.4 },
	brush: { color: '#ff0000', width: 4 }
};

describe('BoardEventMapper', () => {
	it('round-trips a draw event', () => {
		const event = createDrawEvent('u1', segment);
		const wire = JSON.parse(JSON.stringify(BoardEventMapper.toDTO(event)));

		expect(BoardEventMapper.toDomain(wire)).toEqual(event);
	});

	it('round-trips a clear event', () => {
		const event = createClearEvent('u1');
		const wire = JSON.parse(JSON.stringify(BoardEventMapper.toDTO(event)));

		expect(BoardEventMapper.toDomain(wire)).toEqual(event);
	});

	it('clamps out-of-range brush widths coming off the wire', () => {
		const wire = { ...BoardEventMapper.toDTO(createDrawEvent('u1', segment)), width: 9999 };
		const event = BoardEventMapper.toDomain(wire);

		expect(event.type === 'draw' && event.segment.brush.width).toBe(MAX_BRUSH_WIDTH);
	});

	it.each([
		['null', null],
		['a string', 'draw'],
		['missing userId', { type: 'clear' }],
		['unknown type', { type: 'nope', userId: 'u1' }],
		['draw without points', { type: 'draw', userId: 'u1', color: '#000', width: 1 }]
	])('rejects %s', (_label, value) => {
		expect(() => BoardEventMapper.toDomain(value)).toThrow('Not a board event');
	});
});
