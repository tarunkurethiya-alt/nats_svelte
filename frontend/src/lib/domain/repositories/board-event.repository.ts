import type { BoardEvent } from '../entities/board-event';

export type Unsubscribe = () => void;

/** Shares board events with every other participant in the room. */
export interface IBoardEventRepository {
	publish(event: BoardEvent): void;
	subscribe(handler: (event: BoardEvent) => void): Unsubscribe;
}
