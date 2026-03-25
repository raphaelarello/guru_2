import express from 'express';
import type { Request } from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import automationRouter from './automationRouter.js';
import { engine } from './automation/engine.js';
import { requireAuth, requireAdmin } from './middleware/auth.js';
import { saveOdds, listLatestOdds, getOddsEntry, type OddsWebhookPayload } from './lib/oddsFeed.js';
import botsRouter from './routes/bots.js';
import { startBotScheduler, stopBotScheduler } from './lib/botEngine.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ODDS_WEBHOOK_SECRET = process.env.ODDS_WEBHOOK_SECRET || '';

function parseAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGIN || process.env.ALLOWED_ORIGINS || '';
  return raw.split(',').map((value) => value.trim()).filter(Boolean);
}

function verifyHmac(rawBody: Buffer | undefined, signature: string | undefined, secret: string): boolean {
  if (!secret) return process.env.NODE_ENV !== 'production';
  if (!rawBody || !signature) return false;
  const provided = signature.replace(/^sha256=/i, '').trim();
  const candidates = [
    crypto.createHmac('sha256', secret).update(rawBody).digest('hex'),
    crypto.createHmac('sha256', secret).update(rawBody).digest('base64'),
  ];
  return candidates.some((candidate) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(provided));
    } catch {
      return false;
    }
  });
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const allowedOrigins = parseAllowedOrigins();

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'no-referrer' },
  }));
  app.use(cors({
    origin(origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0) return cb(null, process.env.NODE_ENV !== 'production');
      return cb(null, allowedOrigins.includes(origin));
    },
    credentials: true,
  }));

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Muitas tentativas. Aguarde 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    message: { error: 'Limite de requisições atingido.' },
  });
  app.use('/api/', apiLimiter);
  app.use('/api/auth/login', loginLimiter);

  app.use(express.json({
    limit: '2mb',
    verify: (req, _res, buf) => { (req as Request).rawBody = Buffer.from(buf); },
  }));
  app.use(express.urlencoded({ extended: true }));

  try {
    await import('./db/schema.js');
    console.log('[Servidor] Banco SaaS pronto');
  } catch (err) {
    console.warn('[Servidor] Banco SaaS indisponível:', err);
  }

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, uptime: process.uptime(), now: Date.now(), env: process.env.NODE_ENV || 'development' });
  });
  app.get('/api/health/ready', (_req, res) => {
    res.json({ ok: true, automation: true, odds_cache_size: listLatestOdds(5000).length, bots: true });
  });

  try {
    const [authR, payR, adminR] = await Promise.all([
      import('./routes/auth.js').then((m) => m.default),
      import('./routes/payments.js').then((m) => m.default),
      import('./routes/admin.js').then((m) => m.default),
    ]);
    const { default: marketingR } = await import('./routes/marketing.js');
    app.use('/api/auth', authR);
    app.use('/api/payments', payR);
    app.use('/api', adminR);
    app.use('/api', marketingR);
    app.use('/api', botsRouter);
    console.log('[Servidor] Rotas SaaS: /api/auth, /api/payments, /api/admin, /api/user, /api/admin/crm, /api/admin/campaigns, /api/admin/financial, /api/bots');
  } catch (err) {
    console.warn('[Servidor] Rotas SaaS indisponíveis:', err);
    app.use('/api/auth', (_req, res) => res.status(503).json({ error: 'Módulo SaaS indisponível neste ambiente', detalhes: ['Instale dependências: better-sqlite3, bcryptjs, jsonwebtoken'] }));
    app.use('/api/payments', (_req, res) => res.status(503).json({ error: 'Pagamentos indisponíveis neste ambiente', detalhes: ['Defina PAGARME_API_KEY e instale as dependências do módulo SaaS'] }));
  }

  app.post('/api/webhooks/odds', (req, res) => {
    const signature = String(req.headers['x-webhook-signature'] || req.headers['x-hub-signature'] || '');
    if (!verifyHmac(req.rawBody, signature || undefined, ODDS_WEBHOOK_SECRET)) {
      return res.status(401).json({ ok: false, message: 'Assinatura inválida' });
    }

    const body = req.body as OddsWebhookPayload | OddsWebhookPayload[];
    const list = Array.isArray(body) ? body : [body];
    const valid = list.filter((item) => item && item.matchId);
    if (valid.length === 0) return res.status(400).json({ ok: false, message: 'Payload precisa incluir matchId' });
    const saved = valid.map(saveOdds);
    return res.json({ ok: true, saved: saved.length, entries: saved });
  });

  app.get('/api/webhooks/odds/latest', (_req, res) => {
    const entries = listLatestOdds(50);
    res.json({ entries });
  });

  app.get('/api/webhooks/odds/:matchId', (req, res) => {
    const entry = getOddsEntry(req.params.matchId);
    if (!entry) return res.status(404).json({ ok: false, message: 'Nenhum snapshot para este jogo' });
    return res.json(entry);
  });

  app.post('/api/webhooks/odds/demo', requireAuth, requireAdmin, (_req, res) => {
    const sample = [
      { matchId: 'demo-001', source: 'demo', provider: 'Feed demonstração', homeTeam: 'Time da Casa', awayTeam: 'Time Visitante', homeOdds: 1.92, drawOdds: 3.35, awayOdds: 4.1, over25Odds: 1.84, under25Odds: 2.01, over85CornersOdds: 1.95, over35CardsOdds: 1.76 },
      { matchId: 'demo-002', source: 'demo', provider: 'Feed demonstração', homeTeam: 'Favorito FC', awayTeam: 'Zebra SC', homeOdds: 1.68, drawOdds: 3.7, awayOdds: 5.0, over25Odds: 1.71, under25Odds: 2.1, over85CornersOdds: 1.82, over35CardsOdds: 1.88 },
    ];
    sample.forEach(saveOdds);
    res.json({ ok: true, entries: listLatestOdds(20) });
  });

  try {
    await engine.init();
    app.use('/api/automation', automationRouter);
    startBotScheduler();
    console.log('[Servidor] Módulo de automação carregado');
  } catch (err) {
    console.warn('[Servidor] Automação indisponível:', err);
    app.use('/api/automation', (_req, res) => {
      res.status(503).json({ error: 'Módulo de automação indisponível neste ambiente', detalhes: ['Instale o Playwright', 'Execute: pnpm instalar:automacao', 'Reinicie o servidor'] });
    });
  }

  process.on('SIGTERM', async () => {
    await engine.shutdown().catch(() => undefined);
    stopBotScheduler();
    process.exit(0);
  });
  process.on('SIGINT', async () => {
    await engine.shutdown().catch(() => undefined);
    stopBotScheduler();
    process.exit(0);
  });

  const staticPath = process.env.NODE_ENV === 'production' ? path.resolve(__dirname, 'public') : path.resolve(__dirname, '..', 'dist', 'public');

  app.use(express.static(staticPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
