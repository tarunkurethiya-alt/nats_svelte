export interface Logger {
	debug(message: string, ...args: unknown[]): void;
	warn(message: string, ...args: unknown[]): void;
	error(message: string, ...args: unknown[]): void;
}

/** Creates a logger whose output is prefixed with the module it belongs to. */
export function createLogger(scope: string): Logger {
	const prefix = `[${scope}]`;

	return {
		debug: (message, ...args) => console.debug(prefix, message, ...args),
		warn: (message, ...args) => console.warn(prefix, message, ...args),
		error: (message, ...args) => console.error(prefix, message, ...args)
	};
}
