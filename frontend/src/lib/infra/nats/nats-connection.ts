import { connect, type NatsConnection } from 'nats.ws';

export function openNatsConnection(servers: string): Promise<NatsConnection> {
	return connect({ servers, maxReconnectAttempts: -1 });
}
