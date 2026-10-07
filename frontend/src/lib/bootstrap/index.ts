import { createLogger } from '../utils/logger';
import { allFeatures } from './features';
import { connectRealtime, disconnectRealtime } from './realtime.bootstrap';

const log = createLogger('bootstrap');

let bootstrapped: Promise<void> | null = null;

/**
 * Composition root: the only place that wires infra into the domain and the
 * presentation stores. Idempotent; safe to call from every navigation.
 */
export function bootstrapApp(wsUrl: string): Promise<void> {
	bootstrapped ??= connectAndCreateFeatures(wsUrl).catch((err) => {
		// Allow the next navigation to retry.
		bootstrapped = null;
		throw err;
	});
	return bootstrapped;
}

export async function teardownApp(): Promise<void> {
	bootstrapped = null;
	for (const feature of allFeatures) feature.destroy();
	await disconnectRealtime();
}

async function connectAndCreateFeatures(wsUrl: string): Promise<void> {
	const realtimeAdapter = await connectRealtime(wsUrl);

	for (const feature of allFeatures) {
		log.debug(`creating feature ${feature.name}`);
		feature.create({ realtimeAdapter });
	}
}
