export function expectNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
