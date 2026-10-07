import { bootstrapApp } from '$lib/bootstrap';
import { natsWebSocketUrl } from '$lib/bootstrap/config';
import { createLogger } from '$lib/utils/logger';

export const ssr = false;

const log = createLogger('layout');

export async function load() {
	try {
		await bootstrapApp(natsWebSocketUrl());
	} catch (err) {
		// The page still renders, with the board reported as disconnected.
		log.error('Realtime connection failed', err);
	}
}
