import express from 'express';

const router = express.Router();

/**
 * GET /api/account
 * Get account information
 */
router.get('/account', async (req, res) => {
  try {
    const account = await req.exarotonAPI.getAccount();
    res.json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/servers
 * List all servers
 */
router.get('/servers', async (req, res) => {
  try {
    const servers = await req.exarotonAPI.listServers();
    res.json({ success: true, data: servers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/servers/:id
 * Get server information
 */
router.get('/servers/:id', async (req, res) => {
  try {
    const server = await req.exarotonAPI.getServerInfo(req.params.id);
    res.json({ success: true, data: server });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/servers/:id/start
 * Start server
 */
router.post('/servers/:id/start', async (req, res) => {
  try {
    const result = await req.exarotonAPI.startServer(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/servers/:id/stop
 * Stop server
 */
router.post('/servers/:id/stop', async (req, res) => {
  try {
    const result = await req.exarotonAPI.stopServer(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/servers/:id/restart
 * Restart server
 */
router.post('/servers/:id/restart', async (req, res) => {
  try {
    const result = await req.exarotonAPI.restartServer(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/servers/:id/command
 * Execute command
 */
router.post('/servers/:id/command', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ success: false, error: 'Command required' });
    }
    const result = await req.exarotonAPI.executeCommand(req.params.id, command);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/servers/:id/logs
 * Get server logs
 */
router.get('/servers/:id/logs', async (req, res) => {
  try {
    const logs = await req.exarotonAPI.getLogs(req.params.id);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/servers/:id/logs/share
 * Share logs via mclo.gs
 */
router.post('/servers/:id/logs/share', async (req, res) => {
  try {
    const url = await req.exarotonAPI.shareLogs(req.params.id);
    res.json({ success: true, data: { url } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/servers/:id/ram
 * Get server RAM
 */
router.get('/servers/:id/ram', async (req, res) => {
  try {
    const ram = await req.exarotonAPI.getRAM(req.params.id);
    res.json({ success: true, data: { ram } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/servers/:id/ram
 * Set server RAM
 */
router.put('/servers/:id/ram', async (req, res) => {
  try {
    const { ram } = req.body;
    if (!ram || ram < 2 || ram > 16) {
      return res.status(400).json({ 
        success: false, 
        error: 'RAM must be between 2 and 16 GB' 
      });
    }
    const result = await req.exarotonAPI.setRAM(req.params.id, ram);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/servers/:id/motd
 * Get server MOTD
 */
router.get('/servers/:id/motd', async (req, res) => {
  try {
    const motd = await req.exarotonAPI.getMOTD(req.params.id);
    res.json({ success: true, data: { motd } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/servers/:id/motd
 * Set server MOTD
 */
router.put('/servers/:id/motd', async (req, res) => {
  try {
    const { motd } = req.body;
    if (!motd) {
      return res.status(400).json({ success: false, error: 'MOTD required' });
    }
    const result = await req.exarotonAPI.setMOTD(req.params.id, motd);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/servers/:id/players
 * Get player lists
 */
router.get('/servers/:id/players', async (req, res) => {
  try {
    const lists = await req.exarotonAPI.getPlayerLists(req.params.id);
    res.json({ success: true, data: lists });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/servers/:id/players/:list
 * Get player list entries
 */
router.get('/servers/:id/players/:list', async (req, res) => {
  try {
    const entries = await req.exarotonAPI.getPlayerListEntries(
      req.params.id, 
      req.params.list
    );
    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/servers/:id/players/:list
 * Add player to list
 */
router.post('/servers/:id/players/:list', async (req, res) => {
  try {
    const { player } = req.body;
    if (!player) {
      return res.status(400).json({ success: false, error: 'Player name required' });
    }
    const result = await req.exarotonAPI.addPlayerToList(
      req.params.id, 
      req.params.list, 
      player
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/servers/:id/players/:list/:player
 * Remove player from list
 */
router.delete('/servers/:id/players/:list/:player', async (req, res) => {
  try {
    const result = await req.exarotonAPI.removePlayerFromList(
      req.params.id, 
      req.params.list, 
      req.params.player
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
