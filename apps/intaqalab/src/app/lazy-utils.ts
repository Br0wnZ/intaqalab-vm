export function resolveLazyModule<T = unknown>(p: Promise<unknown>): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return p.then((m) => (m as any).default ?? m) as Promise<T>;
}

export default resolveLazyModule;
