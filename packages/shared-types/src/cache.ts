/**
 * Velvet Sentinel - Cache Interface
 * 
 * Abstract caching layer for scalability
 * Supports both Redis (production) and in-memory (development)
 */

export interface CacheConfig {
  type: 'redis' | 'memory';
  redis?: {
    url: string;
    password?: string;
    db?: number;
    keyPrefix?: string;
  };
  defaultTtl?: number; // seconds
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  memoryUsage?: number;
}

/**
 * Abstract cache interface - implement for different backends
 */
export interface ICache {
  // Basic operations
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  
  // Batch operations
  mget<T>(keys: string[]): Promise<(T | null)[]>;
  mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void>;
  
  // Key management
  keys(pattern: string): Promise<string[]>;
  clear(pattern?: string): Promise<number>;
  
  // Stats
  stats(): Promise<CacheStats>;
  
  // Connection
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

/**
 * In-memory cache implementation for development
 */
export class MemoryCache implements ICache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private connected: boolean = false;
  private stats_: { hits: number; misses: number } = { hits: 0, misses: 0 };
  private defaultTtl: number;
  private cleanupInterval?: ReturnType<typeof setInterval>;

  constructor(config?: { defaultTtl?: number }) {
    this.defaultTtl = config?.defaultTtl || 300; // 5 minutes default
  }

  async connect(): Promise<void> {
    this.connected = true;
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    console.log('[MemoryCache] Connected');
  }

  async disconnect(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
    this.connected = false;
    console.log('[MemoryCache] Disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats_.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats_.misses++;
      return null;
    }

    this.stats_.hits++;
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds || this.defaultTtl;
    const now = Date.now();
    
    this.cache.set(key, {
      value,
      expiresAt: now + ttl * 1000,
      createdAt: now,
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)));
  }

  async mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.value, entry.ttl);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const result: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        result.push(key);
      }
    }
    
    return result;
  }

  async clear(pattern?: string): Promise<number> {
    if (!pattern || pattern === '*') {
      const size = this.cache.size;
      this.cache.clear();
      return size;
    }

    const keysToDelete = await this.keys(pattern);
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
    return keysToDelete.length;
  }

  async stats(): Promise<CacheStats> {
    return {
      hits: this.stats_.hits,
      misses: this.stats_.misses,
      size: this.cache.size,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Redis cache implementation for production
 */
export class RedisCache implements ICache {
  private client: any; // Redis client type
  private config: NonNullable<CacheConfig['redis']>;
  private connected: boolean = false;
  private keyPrefix: string;

  constructor(config: NonNullable<CacheConfig['redis']>) {
    this.config = config;
    this.keyPrefix = config.keyPrefix || 'velvet:';
  }

  async connect(): Promise<void> {
    try {
      // Dynamic import to avoid requiring redis in development
      const { createClient } = await import('redis');
      
      this.client = createClient({
        url: this.config.url,
        password: this.config.password,
        database: this.config.db,
      });

      this.client.on('error', (err: Error) => {
        console.error('[RedisCache] Error:', err);
      });

      await this.client.connect();
      this.connected = true;
      console.log('[RedisCache] Connected');
    } catch (error) {
      console.error('[RedisCache] Failed to connect:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
    this.connected = false;
    console.log('[RedisCache] Disconnected');
  }

  isConnected(): boolean {
    return this.connected;
  }

  private prefixKey(key: string): string {
    return this.keyPrefix + key;
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(this.prefixKey(key));
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (ttlSeconds) {
      await this.client.setEx(this.prefixKey(key), ttlSeconds, serialized);
    } else {
      await this.client.set(this.prefixKey(key), serialized);
    }
  }

  async delete(key: string): Promise<boolean> {
    const result = await this.client.del(this.prefixKey(key));
    return result > 0;
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(this.prefixKey(key));
    return result > 0;
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const prefixedKeys = keys.map(k => this.prefixKey(k));
    const values = await this.client.mGet(prefixedKeys);
    
    return values.map((v: string | null) => {
      if (!v) return null;
      try {
        return JSON.parse(v) as T;
      } catch {
        return v as T;
      }
    });
  }

  async mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    const pipeline = this.client.multi();
    
    for (const entry of entries) {
      const serialized = typeof entry.value === 'string' 
        ? entry.value 
        : JSON.stringify(entry.value);
      
      if (entry.ttl) {
        pipeline.setEx(this.prefixKey(entry.key), entry.ttl, serialized);
      } else {
        pipeline.set(this.prefixKey(entry.key), serialized);
      }
    }
    
    await pipeline.exec();
  }

  async keys(pattern: string): Promise<string[]> {
    const prefixedPattern = this.prefixKey(pattern);
    const keys = await this.client.keys(prefixedPattern);
    return keys.map((k: string) => k.slice(this.keyPrefix.length));
  }

  async clear(pattern?: string): Promise<number> {
    const keysToDelete = await this.keys(pattern || '*');
    if (keysToDelete.length === 0) return 0;
    
    const prefixedKeys = keysToDelete.map(k => this.prefixKey(k));
    return await this.client.del(prefixedKeys);
  }

  async stats(): Promise<CacheStats> {
    const info = await this.client.info('stats');
    const memory = await this.client.info('memory');
    
    // Parse Redis INFO response
    const parseInfo = (info: string, key: string): number => {
      const match = info.match(new RegExp(`${key}:(\\d+)`));
      return match ? parseInt(match[1], 10) : 0;
    };

    return {
      hits: parseInfo(info, 'keyspace_hits'),
      misses: parseInfo(info, 'keyspace_misses'),
      size: await this.client.dbSize(),
      memoryUsage: parseInfo(memory, 'used_memory'),
    };
  }
}

/**
 * Create cache instance based on config
 */
export function createCache(config: CacheConfig): ICache {
  if (config.type === 'redis' && config.redis) {
    return new RedisCache(config.redis);
  }
  return new MemoryCache({ defaultTtl: config.defaultTtl });
}

/**
 * Cache key builders for consistent naming
 */
export const CacheKeys = {
  price: (tokenA: string, tokenB: string) => `price:${tokenA}:${tokenB}`,
  opportunity: (id: string) => `opp:${id}`,
  opportunities: () => 'opps:all',
  agentState: (agentId: string) => `agent:${agentId}:state`,
  session: (sessionId: string) => `session:${sessionId}`,
  quote: (dex: string, tokenIn: string, tokenOut: string) => `quote:${dex}:${tokenIn}:${tokenOut}`,
};
