import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { StateManager } from './services/stateManager.js';
import { TelehealthService } from './services/telehealth.js';
import { createApiRouter } from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Instancia servicos core
const stateManager = new StateManager();
const telehealthService = new TelehealthService();

// Conecta rotas REST
app.use('/api/v0', createApiRouter(stateManager, telehealthService));

// Endpoint SSE (Server-Sent Events) para clientes web leves sem WebSocket
app.get('/api/v0/events/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Envia estado inicial imediatamente
  res.write(`data: ${JSON.stringify(stateManager.getAllStates())}\n\n`);

  // Assina mudancas do StateManager
  const unsubscribe = stateManager.subscribe((states) => {
    res.write(`data: ${JSON.stringify(states)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// Configura WebSocket Server para totens e dashboards
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws: WebSocket) => {
  // Envia snapshot inicial
  ws.send(JSON.stringify({ type: 'SNAPSHOT', data: stateManager.getAllStates() }));

  const unsubscribe = stateManager.subscribe((states) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'UPDATE', data: states }));
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
server.listen(PORT, () => {
  console.log(`🚀 FlowCity Saúde API rodando na porta ${PORT}`);
  console.log(`📍 Cidade Âncora: Novo Hamburgo - RS (HMNH, UPA Canudos, USF Santo Afonso, USF Canudos)`);
  console.log(`📡 WebSocket ativo em ws://localhost:${PORT}/ws`);
  console.log(`🔑 Chave pública Ed25519 gerada: ${stateManager.getPublicKey().substring(0, 16)}...`);
});
