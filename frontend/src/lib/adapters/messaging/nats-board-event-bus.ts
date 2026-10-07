import type { NatsConnection } from 'nats.ws';
import type { BoardEventBus, Unsubscribe } from '$lib/application/ports/board-event-bus';
import type { BoardEvent } from '$lib/domain/board-event';
import { decodeBoardEvent, encodeBoardEvent } from './board-event-codec';

/** BoardEventBus backed by a NATS subject. */
export class NatsBoardEventBus implements BoardEventBus {
	readonly #nc: NatsConnection;
	readonly #subject: string;

	constructor(nc: NatsConnection, subject: string) {
		this.#nc = nc;
		this.#subject = subject;
	}

	publish(event: BoardEvent): void {
		if (this.#nc.isClosed()) return;

		this.#nc.publish(this.#subject, encodeBoardEvent(event));
	}

	subscribe(handler: (event: BoardEvent) => void): Unsubscribe {
		const subscription = this.#nc.subscribe(this.#subject);

		(async () => {
			for await (const msg of subscription) {
				let event: BoardEvent;
				try {
					event = decodeBoardEvent(msg.data);
				} catch (err) {
					console.error('Invalid board event', err);
					continue;
				}
				handler(event);
			}
		})();

		return () => subscription.unsubscribe();
	}
}
