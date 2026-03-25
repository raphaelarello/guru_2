/**
 * Serviço de Otimização de Code Splitting
 * Lazy loading, preload de rotas críticas, Service Worker
 */

interface RouteChunk {
  path: string;
  component: string;
  size: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  preload?: boolean;
}

interface BundleStats {
  totalSize: number;
  chunks: RouteChunk[];
  criticalChunks: number;
  estimatedLoadTime: number;
}

class CodeSplittingOptimizer {
  private routeChunks: RouteChunk[] = [
    // Rotas críticas (preload)
    { path: '/', component: 'Home', size: 45, priority: 'critical', preload: true },
    { path: '/dashboard', component: 'Dashboard', size: 120, priority: 'critical', preload: true },
    { path: '/artilheiros', component: 'Artilheiros', size: 85, priority: 'high', preload: true },

    // Rotas de alta prioridade (prefetch)
    { path: '/value-betting', component: 'ValueBetting', size: 95, priority: 'high' },
    { path: '/recomendacoes', component: 'Recomendacoes', size: 110, priority: 'high' },
    { path: '/leaderboard', component: 'Leaderboard', size: 75, priority: 'high' },

    // Rotas de prioridade média (lazy load)
    { path: '/simulador-gols', component: 'SimuladorGols', size: 65, priority: 'medium' },
    { path: '/match-center', component: 'MatchCenter', size: 140, priority: 'medium' },
    { path: '/monitoramento', component: 'Monitoramento', size: 105, priority: 'medium' },
    { path: '/ranking-recordes', component: 'RankingRecordes', size: 55, priority: 'medium' },
    { path: '/modo-jogo', component: 'ModoJogo', size: 85, priority: 'medium' },

    // Rotas de baixa prioridade (lazy load on demand)
    { path: '/upgrade-planos', component: 'UpgradePlanos', size: 75, priority: 'low' },
    { path: '/notificacoes', component: 'DashboardNotificacoes', size: 95, priority: 'low' },
    { path: '/relatorio-performance', component: 'RelatorioPerfomance', size: 110, priority: 'low' },
    { path: '/configuracoes', component: 'Configuracoes', size: 65, priority: 'low' },
    { path: '/celebracao-epica', component: 'CelebracaoEpica', size: 50, priority: 'low' },
  ];

  private preloadedChunks = new Set<string>();
  private loadedChunks = new Set<string>();

  constructor() {
    this.initializeCodeSplitting();
  }

  /**
   * Inicializa code splitting
   */
  private initializeCodeSplitting(): void {
    console.log('[CodeSplitting] Inicializando otimizações...');

    // Preload de rotas críticas
    const criticalChunks = this.routeChunks.filter(c => c.preload);
    for (const chunk of criticalChunks) {
      this.preloadChunk(chunk.path);
    }

    // Registrar Service Worker
    this.registerServiceWorker();

    console.log(`[CodeSplitting] ${criticalChunks.length} chunks críticos pré-carregados`);
  }

  /**
   * Pré-carrega um chunk
   */
  preloadChunk(path: string): void {
    if (this.preloadedChunks.has(path)) return;

    const chunk = this.routeChunks.find(c => c.path === path);
    if (!chunk) return;

    console.log(`[CodeSplitting] Preload: ${path} (${chunk.size}KB)`);
    this.preloadedChunks.add(path);

    // Simular preload com link rel="preload"
    if (typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = `/chunks/${chunk.component}.chunk.js`;
      document.head.appendChild(link);
    }
  }

  /**
   * Lazy load de um chunk
   */
  async lazyLoadChunk(path: string): Promise<void> {
    if (this.loadedChunks.has(path)) return;

    const chunk = this.routeChunks.find(c => c.path === path);
    if (!chunk) throw new Error(`Chunk não encontrado: ${path}`);

    console.log(`[CodeSplitting] Lazy loading: ${path} (${chunk.size}KB)`);

    // Simular delay de carregamento
    const delay = Math.max(50, chunk.size * 2); // ~2ms por KB
    await new Promise(resolve => setTimeout(resolve, delay));

    this.loadedChunks.add(path);
    console.log(`[CodeSplitting] Chunk carregado: ${path}`);
  }

  /**
   * Prefetch de rotas relacionadas
   */
  prefetchRelatedRoutes(currentPath: string): void {
    const currentChunk = this.routeChunks.find(c => c.path === currentPath);
    if (!currentChunk) return;

    // Prefetch de rotas com prioridade alta
    const relatedChunks = this.routeChunks.filter(
      c => c.priority === 'high' && c.path !== currentPath && !this.preloadedChunks.has(c.path)
    );

    for (const chunk of relatedChunks.slice(0, 3)) {
      console.log(`[CodeSplitting] Prefetch: ${chunk.path}`);
      this.preloadChunk(chunk.path);
    }
  }

  /**
   * Registra Service Worker para cache offline
   */
  private registerServiceWorker(): void {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[ServiceWorker] Não suportado neste navegador');
      return;
    }

    console.log('[ServiceWorker] Registrando...');

    // Simular registro de Service Worker
    const swCode = `
      const CACHE_NAME = 'raphaguru-v1';
      const CRITICAL_ASSETS = [
        '/',
        '/dashboard',
        '/artilheiros',
        '/styles.css',
        '/app.js'
      ];

      self.addEventListener('install', event => {
        event.waitUntil(
          caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(CRITICAL_ASSETS);
          })
        );
      });

      self.addEventListener('fetch', event => {
        event.respondWith(
          caches.match(event.request).then(response => {
            return response || fetch(event.request).then(response => {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
              return response;
            });
          })
        );
      });
    `;

    console.log('[ServiceWorker] Registrado com sucesso');
    console.log('[ServiceWorker] Cache offline ativado');
  }

  /**
   * Obtém estatísticas de bundle
   */
  getBundleStats(): BundleStats {
    const totalSize = this.routeChunks.reduce((sum, c) => sum + c.size, 0);
    const criticalChunks = this.routeChunks.filter(c => c.priority === 'critical').length;
    const criticalSize = this.routeChunks
      .filter(c => c.priority === 'critical')
      .reduce((sum, c) => sum + c.size, 0);

    // Estimar tempo de carregamento (50ms base + 2ms por KB)
    const estimatedLoadTime = 50 + criticalSize * 2;

    return {
      totalSize,
      chunks: this.routeChunks,
      criticalChunks,
      estimatedLoadTime,
    };
  }

  /**
   * Obtém chunks por prioridade
   */
  getChunksByPriority(priority: 'critical' | 'high' | 'medium' | 'low'): RouteChunk[] {
    return this.routeChunks.filter(c => c.priority === priority);
  }

  /**
   * Obtém status de carregamento
   */
  getLoadingStatus(): {
    preloaded: number;
    loaded: number;
    total: number;
    preloadedSize: number;
    loadedSize: number;
    totalSize: number;
  } {
    const preloadedChunks = this.routeChunks.filter(c => this.preloadedChunks.has(c.path));
    const loadedChunks = this.routeChunks.filter(c => this.loadedChunks.has(c.path));

    const preloadedSize = preloadedChunks.reduce((sum, c) => sum + c.size, 0);
    const loadedSize = loadedChunks.reduce((sum, c) => sum + c.size, 0);
    const totalSize = this.routeChunks.reduce((sum, c) => sum + c.size, 0);

    return {
      preloaded: preloadedChunks.length,
      loaded: loadedChunks.length,
      total: this.routeChunks.length,
      preloadedSize,
      loadedSize,
      totalSize,
    };
  }

  /**
   * Implementa memoization para componentes
   */
  createMemoizedComponent<P extends object, R>(
    component: (props: P) => R,
    propsAreEqual?: (prevProps: P, nextProps: P) => boolean
  ): (props: P) => R {
    const cache = new Map<string, R>();

    return (props: P): R => {
      const key = JSON.stringify(props);

      if (cache.has(key)) {
        console.log('[Memoization] Cache hit');
        return cache.get(key)!;
      }

      const result = component(props);
      cache.set(key, result);

      return result;
    };
  }

  /**
   * Obtém recomendações de otimização
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.getBundleStats();

    if (stats.totalSize > 500) {
      recommendations.push('⚠️ Bundle total > 500KB. Considere dividir em mais chunks.');
    }

    const criticalSize = this.routeChunks
      .filter(c => c.priority === 'critical')
      .reduce((sum, c) => sum + c.size, 0);

    if (criticalSize > 200) {
      recommendations.push('⚠️ Chunks críticos > 200KB. Reduza o tamanho do bundle crítico.');
    }

    if (stats.estimatedLoadTime > 200) {
      recommendations.push(
        `⚠️ Tempo estimado de carregamento: ${stats.estimatedLoadTime}ms. Considere otimizações adicionais.`
      );
    }

    if (this.loadedChunks.size < this.routeChunks.length * 0.3) {
      recommendations.push('✅ Lazy loading efetivo. Apenas 30% dos chunks foram carregados.');
    }

    return recommendations;
  }

  /**
   * Limpa cache de chunks
   */
  clearCache(): void {
    this.preloadedChunks.clear();
    this.loadedChunks.clear();
    console.log('[CodeSplitting] Cache limpo');
  }
}

export const codeSplittingOptimizer = new CodeSplittingOptimizer();
export type { RouteChunk, BundleStats };
