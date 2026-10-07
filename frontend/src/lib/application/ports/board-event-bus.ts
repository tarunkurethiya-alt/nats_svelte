import type { BoardEvent } from '$lib/domain/board-event';

export type Unsubscribe = () => void;

/** Shares board events with every other participant in the room. */
export interface BoardEventBus {
	publish(event: BoardEvent): void;
	subscribe(handler: (event: BoardEvent) => void): Unsubscribe;
}
