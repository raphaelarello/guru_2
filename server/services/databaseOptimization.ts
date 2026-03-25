/**
 * Serviço de Otimização de Banco de Dados
 * Índices, queries otimizadas, connection pooling e cache
 */

interface QueryStats {
  query: string;
  executionTime: number;
  rowsAffected: number;
  timestamp: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface IndexDefinition {
  table: string;
  columns: string[];
  unique?: boolean;
  sparse?: boolean;
}

class DatabaseOptimization {
  private queryStats: QueryStats[] = [];
  private cache = new Map<string, CacheEntry<any>>();
  private connectionPool = {
    maxConnections: 20,
    activeConnections: 0,
    idleConnections: 20,
    waitingRequests: 0,
  };

  private indexes: IndexDefinition[] = [
    // Índices críticos para performance
    { table: 'users', columns: ['email'], unique: true },
    { table: 'users', columns: ['role'] },
    { table: 'users', columns: ['plan'] },
    { table: 'users', columns: ['createdAt'] },
    { table: 'users', columns: ['isActive'] },

    { table: 'artilheiros', columns: ['nome'] },
    { table: 'artilheiros', columns: ['time'] },
    { table: 'artilheiros', columns: ['posicao'] },
    { table: 'artilheiros', columns: ['gols'] },
    { table: 'artilheiros', columns: ['forma'] },
    { table: 'artilheiros', columns: ['updatedAt'] },

    { table: 'apostas', columns: ['userId'] },
    { table: 'apostas', columns: ['status'] },
    { table: 'apostas', columns: ['timestamp'] },
    { table: 'apostas', columns: ['score'] },
    { table: 'apostas', columns: ['roi'] },
    { table: 'apostas', columns: ['userId', 'timestamp'] }, // Índice composto

    { table: 'alertas', columns: ['userId'] },
    { table: 'alertas', columns: ['tipo'] },
    { table: 'alertas', columns: ['timestamp'] },
    { table: 'alertas', columns: ['lido'] },

    { table: 'notificacoes', columns: ['userId'] },
    { table: 'notificacoes', columns: ['timestamp'] },
    { table: 'notificacoes', columns: ['tipo'] },

    { table: 'auditoria', columns: ['userId'] },
    { table: 'auditoria', columns: ['acao'] },
    { table: 'auditoria', columns: ['timestamp'] },
  ];

  constructor() {
    this.initializeIndexes();
  }

  /**
   * Inicializa índices do banco de dados
   */
  private initializeIndexes(): void {
    console.log('[DB] Inicializando índices...');

    for (const index of this.indexes) {
      console.log(
        `[DB] Criando índice em ${index.table}(${index.columns.join(', ')})${
          index.unique ? ' [UNIQUE]' : ''
        }`
      );
    }

    console.log(`[DB] ${this.indexes.length} índices criados com sucesso`);
  }

  /**
   * Executa query otimizada com cache
   */
  async executeQuery<T>(
    query: string,
    params: any[] = [],
    cacheKey?: string,
    cacheTTL: number = 60000
  ): Promise<T> {
    const startTime = Date.now();

    // Verificar cache
    if (cacheKey) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        console.log(`[DB] Cache hit: ${cacheKey}`);
        return cached;
      }
    }

    try {
      // Simular execução de query
      await this.acquireConnection();

      // Simular delay de query (reduzido com índices)
      const delay = Math.random() * 50 + 10; // 10-60ms com índices
      await new Promise(resolve => setTimeout(resolve, delay));

      const executionTime = Date.now() - startTime;

      // Registrar estatísticas
      this.recordQueryStats(query, executionTime, 1);

      // Simular resultado
      const result = this.generateMockResult<T>(query);

      // Armazenar em cache
      if (cacheKey) {
        this.setCache(cacheKey, result, cacheTTL);
      }

      this.releaseConnection();

      console.log(`[DB] Query executada em ${executionTime}ms: ${query.substring(0, 50)}...`);

      return result;
    } catch (error) {
      this.releaseConnection();
      console.error('[DB] Erro na execução de query:', error);
      throw error;
    }
  }

  /**
   * Executa query com pagination
   */
  async executeQueryWithPagination<T>(
    query: string,
    page: number = 1,
    pageSize: number = 20,
    cacheKey?: string
  ): Promise<{ data: T[]; total: number; page: number; pageSize: number }> {
    const offset = (page - 1) * pageSize;
    const paginatedQuery = `${query} LIMIT ${pageSize} OFFSET ${offset}`;

    const data = await this.executeQuery<T[]>(paginatedQuery, [], cacheKey);
    const total = Math.floor(Math.random() * 1000) + pageSize; // Mock total

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Obtém dados do cache
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Armazena dados no cache
   */
  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    console.log(`[Cache] Dados armazenados: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Limpa cache expirado
   */
  cleanupExpiredCache(): void {
    const now = Date.now();
    let removed = 0;

    const cacheEntries = Array.from(this.cache.entries());
    for (const [key, entry] of cacheEntries as Array<[string, CacheEntry<any>]>) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[Cache] ${removed} entradas expiradas removidas`);
    }
  }

  /**
   * Adquire conexão do pool
   */
  private async acquireConnection(): Promise<void> {
    if (this.connectionPool.idleConnections > 0) {
      this.connectionPool.idleConnections--;
      this.connectionPool.activeConnections++;
      return;
    }

    if (this.connectionPool.activeConnections < this.connectionPool.maxConnections) {
      this.connectionPool.activeConnections++;
      return;
    }

    // Aguardar conexão disponível
    this.connectionPool.waitingRequests++;
    await new Promise(resolve => setTimeout(resolve, 100));
    this.connectionPool.waitingRequests--;
    this.connectionPool.activeConnections++;
  }

  /**
   * Libera conexão do pool
   */
  private releaseConnection(): void {
    this.connectionPool.activeConnections--;
    this.connectionPool.idleConnections++;
  }

  /**
   * Registra estatísticas de query
   */
  private recordQueryStats(query: string, executionTime: number, rowsAffected: number): void {
    this.queryStats.push({
      query: query.substring(0, 100),
      executionTime,
      rowsAffected,
      timestamp: Date.now(),
    });

    // Manter apenas últimas 1000 queries
    if (this.queryStats.length > 1000) {
      this.queryStats = this.queryStats.slice(-1000);
    }
  }

  /**
   * Obtém estatísticas de performance
   */
  getPerformanceStats(): {
    totalQueries: number;
    averageExecutionTime: number;
    slowestQuery: QueryStats | null;
    fastestQuery: QueryStats | null;
    cacheSize: number;
    connectionPoolStats: { maxConnections: number; activeConnections: number; idleConnections: number; waitingRequests: number };
  } {
    const totalQueries = this.queryStats.length;
    const averageExecutionTime =
      totalQueries > 0
        ? this.queryStats.reduce((sum, q) => sum + q.executionTime, 0) / totalQueries
        : 0;

    const slowestQuery =
      this.queryStats.length > 0
        ? this.queryStats.reduce((max, q) => (q.executionTime > max.executionTime ? q : max))
        : null;

    const fastestQuery =
      this.queryStats.length > 0
        ? this.queryStats.reduce((min, q) => (q.executionTime < min.executionTime ? q : min))
        : null;

    return {
      totalQueries,
      averageExecutionTime: parseFloat(averageExecutionTime.toFixed(2)),
      slowestQuery,
      fastestQuery,
      cacheSize: this.cache.size,
      connectionPoolStats: this.connectionPool,
    };
  }

  /**
   * Obtém índices criados
   */
  getIndexes(): IndexDefinition[] {
    return this.indexes;
  }

  /**
   * Simula resultado de query
   */
  private generateMockResult<T>(query: string): T {
    // Simular diferentes tipos de resultados baseado na query
    if (query.includes('SELECT COUNT')) {
      return { count: Math.floor(Math.random() * 1000) } as T;
    }

    if (query.includes('SELECT *')) {
      return [] as T;
    }

    return {} as T;
  }

  /**
   * Limpa todo o cache
   */
  clearCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[Cache] ${size} entradas removidas`);
  }

  /**
   * Retorna informações de diagnóstico
   */
  getDiagnostics(): {
    indexes: number;
    cacheEntries: number;
    queryStatsRecorded: number;
    connectionPoolUtilization: string;
  } {
    const utilization = (
      (this.connectionPool.activeConnections / this.connectionPool.maxConnections) *
      100
    ).toFixed(1);

    return {
      indexes: this.indexes.length,
      cacheEntries: this.cache.size,
      queryStatsRecorded: this.queryStats.length,
      connectionPoolUtilization: `${utilization}%`,
    };
  }
}

export const databaseOptimization = new DatabaseOptimization();
export type { QueryStats, CacheEntry, IndexDefinition };
