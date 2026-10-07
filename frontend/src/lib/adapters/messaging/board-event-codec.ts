import { StringCodec } from 'nats.ws';
import { createClearEvent, createDrawEvent, type BoardEvent } from '$lib/domain/board-event';
import { createBrush } from '$lib/domain/brush';
import type { Point } from '$lib/domain/point';

/*
 * Wire format (v1). Kept separate from the domain types so that domain
 * refactors cannot silently break clients running an older version.
 */
type PointMessage = { x: number; y: number };

type DrawMessage = {
	type: 'draw';
	userId: string;
	from: PointMessage;
	to: PointMessage;
	color: string;
	width: number;
};

type ClearMessage = {
	type: 'clear';
	userId: string;
};

type BoardEventMessage = DrawMessage | ClearMessage;

const sc = StringCodec();

export function encodeBoardEvent(event: BoardEvent): Uint8Array {
	return sc.encode(JSON.stringify(toMessage(event)));
}

/** Decodes a message from the wire, throwing if it is not a valid board event. */
export function decodeBoardEvent(data: Uint8Array): BoardEvent {
	const value: unknown = JSON.parse(sc.decode(data));
	if (!isBoardEventMessage(value)) throw new Error('Not a board event');
	return fromMessage(value);
}

function toMessage(event: BoardEvent): BoardEventMessage {
	switch (event.type) {
		case 'draw': {
			const { from, to, brush } = event.segment;
			return {
				type: 'draw',
				userId: event.userId,
				from: toPointMessage(from),
				to: toPointMessage(to),
				color: brush.color,
				width: brush.width
			};
		}
		case 'clear':
			return { type: 'clear', userId: event.userId };
	}
}

function fromMessage(message: BoardEventMessage): BoardEvent {
	switch (message.type) {
		case 'draw':
			return createDrawEvent(message.userId, {
				from: fromPointMessage(message.from),
				to: fromPointMessage(message.to),
				brush: createBrush(message.color, message.width)
			});
		case 'clear':
			return createClearEvent(message.userId);
	}
}

function toPointMessage({ x, y }: Point): PointMessage {
	return { x, y };
}

function fromPointMessage({ x, y }: PointMessage): Point {
	return { x, y };
}

function isBoardEventMessage(value: unknown): value is BoardEventMessage {
	if (!isRecord(value) || typeof value.userId !== 'string') return false;

	switch (value.type) {
		case 'clear':
			return true;
		case 'draw':
			return (
				isPointMessage(value.from) &&
				isPointMessage(value.to) &&
				typeof value.color === 'string' &&
				typeof value.width === 'number'
			);
		default:
			return false;
	}
}

function isPointMessage(value: unknown): value is PointMessage {
	return isRecord(value) && typeof value.x === 'number' && typeof value.y === 'number';
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}
