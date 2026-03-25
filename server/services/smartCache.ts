/**
 * Cache Inteligente com Estratégias de Invalidação
 * Otimiza performance mantendo dados frescos
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em segundos
  hits: number;
  lastAccess: number;
  priority: 'low' | 'medium' | 'high';
}

interface CacheStats {
  totalEntries: number;
  hitRate: number;
  memoryUsed: number;
  oldestEntry: number;
  newestEntry: number;
}

class SmartCache {
  private cache = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;
  private maxSize = 100; // Máximo de entradas
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Limpeza automática a cada 5 minutos
    this.startAutoCleanup();
  }

  /**
   * Define valor no cache
   */
  set<T>(key: string, value: T, ttl: number = 300, priority: 'low' | 'medium' | 'high' = 'medium'): void {
    // Se cache está cheio, remover entradas de baixa prioridade
    if (this.cache.size >= this.maxSize) {
      this.evictLowPriority();
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttl * 1000, // Converter para ms
      hits: 0,
      lastAccess: Date.now(),
      priority,
    });

    console.log(`[SmartCache] Set: ${key} (TTL: ${ttl}s, Priority: ${priority})`);
  }

  /**
   * Obtém valor do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      console.log(`[SmartCache] Expired: ${key}`);
      return null;
    }

    // Atualizar metadados
    entry.hits++;
    entry.lastAccess = Date.now();
    this.hits++;

    return entry.data as T;
  }

  /**
   * Verifica se chave existe e está válida
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove entrada específica
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Limpa cache por padrão (regex)
   */
  deletePattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    let deleted = 0;

    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    console.log(`[SmartCache] Deleted ${deleted} entries matching pattern: ${pattern}`);
    return deleted;
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    console.log('[SmartCache] Cache cleared');
  }

  /**
   * Remove entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[SmartCache] Cleanup: Removed ${removed} expired entries`);
    }
  }

  /**
   * Remove entradas de baixa prioridade quando cache está cheio
   */
  private evictLowPriority(): void {
    const cacheEntries = Array.from(this.cache.entries());
    const entries = cacheEntries;

    // Ordenar por: prioridade (desc), hits (asc), lastAccess (asc)
    entries.sort(([, a], [, b]) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];

      if (priorityDiff !== 0) return priorityDiff;

      const hitsDiff = a.hits - b.hits;
      if (hitsDiff !== 0) return hitsDiff;

      return a.lastAccess - b.lastAccess;
    });

    // Remover 10% das entradas com menor prioridade
    const toRemove = Math.ceil(entries.length * 0.1);
    for (let i = entries.length - toRemove; i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }

    console.log(`[SmartCache] Evicted ${toRemove} low-priority entries`);
  }

  /**
   * Inicia limpeza automática
   */
  private startAutoCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // 5 minutos
  }

  /**
   * Para limpeza automática
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Retorna estatísticas do cache
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);

    const totalHits = this.hits;
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;

    return {
      totalEntries: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsed: JSON.stringify(Array.from(this.cache.values())).length,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
    };
  }

  /**
   * Retorna informações detalhadas do cache
   */
  getInfo(): {
    size: number;
    entries: Array<{ key: string; hits: number; ttl: number; priority: string; age: number }>;
    stats: CacheStats;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      hits: entry.hits,
      ttl: entry.ttl / 1000,
      priority: entry.priority,
      age: Date.now() - entry.timestamp,
    }));

    return {
      size: this.cache.size,
      entries,
      stats: this.getStats(),
    };
  }
}

export const smartCache = new SmartCache();
export type { CacheEntry, CacheStats };
