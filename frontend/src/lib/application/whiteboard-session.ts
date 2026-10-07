import type { BoardRenderer } from './ports/board-renderer';
import type { WhiteboardService } from './whiteboard-service';

/** A live connection to a shared board. */
export type WhiteboardSession = {
	whiteboard: WhiteboardService;
	/** Resolves when the connection is closed for good. */
	closed: Promise<void>;
	close(): Promise<void>;
};

/** Opens a session that renders onto the given renderer. Provided by the infra layer. */
export type OpenWhiteboardSession = (renderer: BoardRenderer) => Promise<WhiteboardSession>;
