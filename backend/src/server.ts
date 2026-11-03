import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { StateManager } from './services/stateManager.js';
import { TelehealthService } from './services/telehealth.js';
import { createApiRouter } from './routes/api.js';
import { PersistenceService } from './services/persistence.js';
import { KAnonymityGuard } from './services/privacy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '256kb' }));
app.use('/api/v0', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false, message: { erro: 'Limite de requisições atingido; tente novamente mais tarde.' } }));

// Instancia servicos core
const persistence = new PersistenceService();
const stateManager = new StateManager(persistence);
const telehealthService = new TelehealthService(persistence);
const getPublicStates = () => stateManager.getAllStates().map((state) => KAnonymityGuard.sanitizeState(state, (payload) => stateManager.signPublicPayload(payload)));

// Conecta rotas REST
app.use('/api/v0', createApiRouter(stateManager, telehealthService, persistence));

// Endpoint SSE (Server-Sent Events) para clientes web leves sem WebSocket
app.get('/api/v0/events/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Envia estado inicial imediatamente
  res.write(`data: ${JSON.stringify(getPublicStates())}\n\n`);

  // Assina mudancas do StateManager
  const unsubscribe = stateManager.subscribe((states) => {
    res.write(`data: ${JSON.stringify(states.map((state) => KAnonymityGuard.sanitizeState(state, (payload) => stateManager.signPublicPayload(payload))))}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// Configura WebSocket Server para totens e dashboards
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  // Envia snapshot inicial
  ws.send(JSON.stringify({ type: 'SNAPSHOT', data: getPublicStates() }));

  const unsubscribe = stateManager.subscribe((states) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'UPDATE', data: states.map((state) => KAnonymityGuard.sanitizeState(state, (payload) => stateManager.signPublicPayload(payload))) }));
    }
  });

  ws.on('close', () => {
    unsubscribe();
  });
});

// Servir frontend se os arquivos de build existirem
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

app.get('*', (req: Request, res: Response, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) {
      res.json({
        message: 'FlowCity Saúde API Operational. Frontend build not present in dist. Run npm run build in frontend.',
        endpoints: '/api/v0/units, /api/v0/states, /api/v0/system/metrics'
      });
    }
  });
});

const PORT = process.env.PORT || 3001;

async function startServer(): Promise<void> {
  await stateManager.restorePersistedStates();
  await telehealthService.restorePersistedRecords();
  await persistence.appendAudit({ actor: 'system', action: 'server.started', entityType: 'system' });
  server.listen(PORT, () => {
    console.log(JSON.stringify({ level: 'info', event: 'server_started', port: PORT, persistence: persistence.driver }));
  });
}

void startServer().catch((error: unknown) => {
  console.error(JSON.stringify({ level: 'error', event: 'server_start_failed', message: error instanceof Error ? error.message : 'unknown error' }));
  process.exitCode = 1;
});

async function shutdown(): Promise<void> {
  stateManager.destroy();
  server.close();
  await persistence.close();
}

process.on('SIGINT', () => { void shutdown(); });
process.on('SIGTERM', () => { void shutdown(); });
