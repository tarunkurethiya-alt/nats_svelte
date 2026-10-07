import { WhiteboardUseCases } from '../../domain/usecases/whiteboard.usecases';
import { BoardEventRepository } from '../../infra/data/repositories/board-event.repository';
import { whiteboardStore } from '../../presentation/stores/whiteboard.store.svelte';
import { WHITEBOARD_SUBJECT } from '../config';
import type { FeatureModule } from '../types';

export const whiteboardFeature: FeatureModule = {
	name: 'whiteboard',

	create({ realtimeAdapter }) {
		const repo = new BoardEventRepository(realtimeAdapter, WHITEBOARD_SUBJECT);

		whiteboardStore.init(new WhiteboardUseCases(repo, crypto.randomUUID()));
		whiteboardStore.setConnected(true);

		void realtimeAdapter.closed().then(() => whiteboardStore.setConnected(false));
	},

	destroy() {
		whiteboardStore.reset();
	}
};
