import type { memoryStore } from './store.memory';

type SyncStore = typeof memoryStore;

export type AsyncStore = {
  [K in keyof SyncStore]: SyncStore[K] extends (...args: infer Args) => infer Result
    ? (...args: Args) => Promise<Awaited<Result>>
    : never;
};
