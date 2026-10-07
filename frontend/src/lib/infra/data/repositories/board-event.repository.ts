import type { NatsConnection } from 'nats.ws';
import type { BoardEvent } from '../../../domain/entities/board-event';
import type {
	IBoardEventRepository,
	Unsubscribe
} from '../../../domain/repositories/board-event.repository';
import { createLogger } from '../../../utils/logger';
import { BoardEventMapper } from '../../mappers/board-event.mapper';

const log = createLogger('repo:board-event');
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** IBoardEventRepository backed by a NATS subject. */
export class BoardEventRepository implements IBoardEventRepository {
	constructor(
		private readonly nc: NatsConnection,
		private readonly subject: string
	) {}

	publish(event: BoardEvent): void {
		if (this.nc.isClosed()) return;

		this.nc.publish(this.subject, encoder.encode(JSON.stringify(BoardEventMapper.toDTO(event))));
	}

	subscribe(handler: (event: BoardEvent) => void): Unsubscribe {
		const subscription = this.nc.subscribe(this.subject);

		void (async () => {
			for await (const msg of subscription) {
				try {
					handler(BoardEventMapper.toDomain(JSON.parse(decoder.decode(msg.data))));
				} catch (err) {
					log.warn('Dropped invalid board event', err);
				}
			}
		})();

		return () => subscription.unsubscribe();
	}
}



//"type" means that it is erased in the compiled JavaScript code, so it is only used for type checking in TypeScript.
