/**
 * Debounce with cleanup
 */
export const debounceWithCleanup = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): [(...args: Parameters<T>) => void, () => void] => {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };

  const cleanup = () => {
    if (timeout) clearTimeout(timeout);
  };

  return [debounced, cleanup];
};

/**
 * Request animation frame throttle
 */
export const rafThrottle = <T extends (...args: any[]) => any>(func: T) => {
  let scheduled = false;

  return (...args: Parameters<T>) => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        func(...args);
        scheduled = false;
      });
    }
  };
};

/**
 * Batch state updates
 */
export const batchUpdates = (callbacks: (() => void)[]) => {
  if ('unstable_batchedUpdates' in window) {
    (window as any).unstable_batchedUpdates(() => {
      callbacks.forEach((cb) => cb());
    });
  } else {
    callbacks.forEach((cb) => cb());
  }
};

/**
 * Cache with TTL
 */
export class CacheWithTTL<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private ttl: number;

  constructor(ttlMs: number = 5 * 60 * 1000) {
    this.ttl = ttlMs;
  }

  set(key: string, value: T): void {
    this.cache.set(key, { data: value, timestamp: Date.now() });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}