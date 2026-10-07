import {
	createClearEvent,
	createDrawEvent,
	type BoardEvent,
	type UserId
} from '../entities/board-event';
import type { Segment } from '../entities/segment';
import type { IBoardEventRepository, Unsubscribe } from '../repositories/board-event.repository';

export class WhiteboardUseCases {
	constructor(
		private readonly repo: IBoardEventRepository,
		private readonly userId: UserId
	) {}

	shareSegment(segment: Segment): void {
		this.repo.publish(createDrawEvent(this.userId, segment));
	}

	shareClear(): void {
		this.repo.publish(createClearEvent(this.userId));
	}

	/** Receives events from other users only; our own are already on the local board. */
	subscribeToRemoteEvents(handler: (event: BoardEvent) => void): Unsubscribe {
		return this.repo.subscribe((event) => {
			if (event.userId !== this.userId) handler(event);
		});
	}
}
