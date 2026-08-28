/**
 * Shared test helpers. Keep pure and free of production side-effects.
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
