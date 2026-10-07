import {
	createClearEvent,
	createDrawEvent,
	type BoardEvent
} from '../../domain/entities/board-event';
import { createBrush } from '../../domain/entities/brush';
import type { Point } from '../../domain/entities/point';

/*
 * Wire format (v1). Kept separate from the domain types so that domain
 * refactors cannot silently break clients running an older version.
 */
interface PointDTO {
	x: number;
	y: number;
}

interface DrawDTO {
	type: 'draw';
	userId: string;
	from: PointDTO;
	to: PointDTO;
	color: string;
	width: number;
}

interface ClearDTO {
	type: 'clear';
	userId: string;
}

export type BoardEventDTO = DrawDTO | ClearDTO;

export class BoardEventMapper {
	static toDTO(event: BoardEvent): BoardEventDTO {
		switch (event.type) {
			case 'draw': {
				const { from, to, brush } = event.segment;
				return {
					type: 'draw',
					userId: event.userId,
					from: BoardEventMapper.toPointDTO(from),
					to: BoardEventMapper.toPointDTO(to),
					color: brush.color,
					width: brush.width
				};
			}
			case 'clear':
				return { type: 'clear', userId: event.userId };
		}
	}

	/** Maps untrusted wire data to a domain event, throwing if it is not a valid board event. */
	static toDomain(value: unknown): BoardEvent {
		if (!isBoardEventDTO(value)) throw new Error('Not a board event');

		switch (value.type) {
			case 'draw':
				return createDrawEvent(value.userId, {
					from: BoardEventMapper.toPoint(value.from),
					to: BoardEventMapper.toPoint(value.to),
					brush: createBrush(value.color, value.width)
				});
			case 'clear':
				return createClearEvent(value.userId);
		}
	}

	private static toPointDTO({ x, y }: Point): PointDTO {
		return { x, y };
	}

	private static toPoint({ x, y }: PointDTO): Point {
		return { x, y };
	}
}

function isBoardEventDTO(value: unknown): value is BoardEventDTO {
	if (!isRecord(value) || typeof value.userId !== 'string') return false;

	switch (value.type) {
		case 'clear':
			return true;
		case 'draw':
			return (
				isPointDTO(value.from) &&
				isPointDTO(value.to) &&
				typeof value.color === 'string' &&
				typeof value.width === 'number'
			);
		default:
			return false;
	}
}

function isPointDTO(value: unknown): value is PointDTO {
	return isRecord(value) && typeof value.x === 'number' && typeof value.y === 'number';
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
