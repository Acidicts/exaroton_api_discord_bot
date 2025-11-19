import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { config } from 'dotenv';
import ExarotonAPI from './api/exaroton.js';
import apiRoutes from './routes/api.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validate API token
if (!process.env.EXAROTON_API_TOKEN) {
  console.error('Error: EXAROTON_API_TOKEN not found in environment variables');
  console.error('Please copy .env.example to .env and add your API token');
  process.exit(1);
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize exaroton API
const exarotonAPI = new ExarotonAPI(process.env.EXAROTON_API_TOKEN);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (dashboard)
app.use(express.static(join(__dirname, '../public')));

// Make API available to routes
app.use((req, res, next) => {
  req.exarotonAPI = exarotonAPI;
  next();
});

// API Routes
app.use('/api', apiRoutes);

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Dashboard available at http://localhost:${PORT}`);
  console.log(`✓ API endpoints available at http://localhost:${PORT}/api`);
});

// Initialize WebSocket server
const wss = new WebSocketServer({ server });

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('✓ New WebSocket connection established');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case 'subscribe':
          handleSubscribe(ws, data, exarotonAPI);
          break;
        case 'unsubscribe':
          handleUnsubscribe(ws, data, exarotonAPI);
          break;
        default:
          ws.send(JSON.stringify({ error: 'Unknown message type' }));
      }
    } catch (error) {
      console.error('WebSocket error:', error);
      ws.send(JSON.stringify({ error: error.message }));
    }
  });

  ws.on('close', () => {
    console.log('✓ WebSocket connection closed');
  });

  ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));
});

/**
 * Handle server subscription
 */
function handleSubscribe(ws, data, api) {
  const { serverId, streams } = data;
  
  if (!serverId) {
    ws.send(JSON.stringify({ error: 'Server ID required' }));
    return;
  }

  try {
    const server = api.subscribeToServer(serverId, streams || []);
    
    // Listen for status updates
    server.on('status', (server) => {
      ws.send(JSON.stringify({
        type: 'status',
        data: {
          id: server.id,
          name: server.name,
          status: server.status,
          host: server.host,
          port: server.port,
          players: server.players
        }
      }));
    });

    // Listen for console output
    if (streams?.includes('console')) {
      server.on('console:line', (data) => {
        ws.send(JSON.stringify({
          type: 'console',
          data: {
            line: data.line,
            timestamp: new Date().toISOString()
          }
        }));
      });
    }

    // Listen for tick data
    if (streams?.includes('tick')) {
      server.on('tick:tick', (data) => {
        ws.send(JSON.stringify({
          type: 'tick',
          data: {
            averageTickTime: data.averageTickTime,
            tps: data.tps
          }
        }));
      });
    }

    // Listen for RAM stats
    if (streams?.includes('heap')) {
      server.on('heap:heap', (data) => {
        ws.send(JSON.stringify({
          type: 'heap',
          data: {
            usage: data.usage
          }
        }));
      });
    }

    ws.send(JSON.stringify({
      type: 'subscribed',
      serverId,
      streams: streams || ['status']
    }));
  } catch (error) {
    ws.send(JSON.stringify({ error: error.message }));
  }
}

/**
 * Handle server unsubscription
 */
function handleUnsubscribe(ws, data, api) {
  const { serverId, streams } = data;
  
  if (!serverId) {
    ws.send(JSON.stringify({ error: 'Server ID required' }));
    return;
  }

  try {
    api.unsubscribeFromServer(serverId, streams);
    ws.send(JSON.stringify({
      type: 'unsubscribed',
      serverId
    }));
  } catch (error) {
    ws.send(JSON.stringify({ error: error.message }));
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

export default app;
