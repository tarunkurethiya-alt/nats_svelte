export const WHITEBOARD_SUBJECT = 'whiteboard.room1';

/** NATS WebSocket URL. Uses the host serving the Svelte app. Browser-only. */
export function natsWebSocketUrl(): string {
	return `ws://${window.location.hostname}:9222`;
}
