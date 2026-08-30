export function rotateItems<T>(items: T[], seed = 0): T[] {
  if (items.length <= 1) return [...items];

  const safeSeed = Number.isFinite(seed) ? Math.trunc(seed) : 0;
  const offset = ((safeSeed % items.length) + items.length) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

/** Advance by a whole batch so consecutive runs cover the source pool. */
export function selectRotatingBatch<T>(items: T[], batchSize: number, seed = 0): T[] {
  const size = Number.isFinite(batchSize)
    ? Math.min(Math.max(Math.floor(batchSize), 0), items.length)
    : items.length;
  if (size === 0) return [];

  return rotateItems(items, seed * size).slice(0, size);
}

/** Keep first-slot batches advancing even when only one provider fits per run. */
export function getSourceBatchSeed(daySeed: number, sourceOrder: string[], source: string) {
  return sourceOrder[0] === source
    ? Math.floor(daySeed / Math.max(sourceOrder.length, 1))
    : daySeed;
}
