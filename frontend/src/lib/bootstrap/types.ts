import type { NatsConnection } from 'nats.ws';

/** Everything a feature may need to build its repositories. */
export interface FeatureAdapters {
	realtimeAdapter: NatsConnection;
}

export interface FeatureModule {
	name: string;
	create(adapters: FeatureAdapters): void;
	destroy(): void;
}
