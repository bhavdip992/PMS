class AICache {
  private cache: Map<string, { value: any; expiresAt: number }> = new Map();
  private defaultTTL = 10 * 60 * 1000; // 10 minutes default TTL

  set(key: string, value: any, ttlMs: number = this.defaultTTL): void {
    const expiresAt = Date.now() + ttlMs;
    this.cache.set(key, { value, expiresAt });
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const aiCache = new AICache();
