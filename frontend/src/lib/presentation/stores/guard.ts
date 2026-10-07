/** Returns `value`, or throws if the store it belongs to has not been initialised yet. */
export function requireInit<T>(value: T | undefined, storeName: string): T {
	if (value === undefined) {
		throw new Error(`${storeName} used before init(); is its feature registered in bootstrap?`);
	}
	return value;
}
