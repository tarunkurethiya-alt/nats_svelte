import type { NatsConnection } from 'nats.ws';
import { openNatsConnection } from '../infra/nats/nats-connection';

let connection: NatsConnection | null = null;

export async function connectRealtime(url: string): Promise<NatsConnection> {
	connection ??= await openNatsConnection(url);
	return connection;
}

export async function disconnectRealtime(): Promise<void> {
	const nc = connection;
	connection = null;
	await nc?.close();
}
