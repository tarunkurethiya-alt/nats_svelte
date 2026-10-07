import type { OpenWhiteboardSession } from '$lib/application/whiteboard-session';
import { WhiteboardService } from '$lib/application/whiteboard-service';
import { NatsBoardEventBus } from '$lib/adapters/messaging/nats-board-event-bus';
import { natsWebSocketUrl, WHITEBOARD_SUBJECT } from './config';
import { openNatsConnection } from './nats/nats-connection';

/** Composition root: wires the concrete adapters into the application. */
export const openWhiteboardSession: OpenWhiteboardSession = async (renderer) => {
	const nc = await openNatsConnection(natsWebSocketUrl());

	const whiteboard = new WhiteboardService({
		userId: crypto.randomUUID(),
		bus: new NatsBoardEventBus(nc, WHITEBOARD_SUBJECT),
		renderer
	});

	return {
		whiteboard,
		closed: nc.closed().then(() => undefined),
		close: () => nc.close()
	};
};
