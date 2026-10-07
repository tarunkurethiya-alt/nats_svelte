import type { Segment } from './segment';

export type UserId = string;

export type DrawEvent = {
	readonly type: 'draw';
	readonly userId: UserId;
	readonly segment: Segment;
};

export type ClearEvent = {
	readonly type: 'clear';
	readonly userId: UserId;
};

export type BoardEvent = DrawEvent | ClearEvent;

export function createDrawEvent(userId: UserId, segment: Segment): DrawEvent {
	return { type: 'draw', userId, segment };
}

export function createClearEvent(userId: UserId): ClearEvent {
	return { type: 'clear', userId };
}
