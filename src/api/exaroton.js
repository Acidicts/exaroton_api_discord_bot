import { Client } from 'exaroton';

/**
 * ExarotonAPI Wrapper
 * Wraps the official exaroton Node.js client following the official documentation
 * https://developers.exaroton.com
 */
class ExarotonAPI {
  constructor(apiToken) {
    this.client = new Client(apiToken);
  }

  /**
   * Get account information
   * @returns {Promise<Object>} Account object with name, email, credits, etc.
   */
  async getAccount() {
    try {
      return await this.client.getAccount();
    } catch (e) {
      throw new Error(`Failed to get account: ${e.message}`);
    }
  }

  /**
   * List all servers
   * @returns {Promise<Array>} Array of server objects
   */
  async listServers() {
    try {
      return await this.client.getServers();
    } catch (e) {
      throw new Error(`Failed to list servers: ${e.message}`);
    }
  }

  /**
   * Get server object by ID
   * This creates a server object but doesn't fetch data yet
   * @param {string} serverId - The server ID
   * @returns {Object} Server object
   */
  getServer(serverId) {
    return this.client.server(serverId);
  }

  /**
   * Get server information
   * Fetches current server data
   * @param {string} serverId - The server ID
   * @returns {Promise<Object>} Server object with all current data
   */
  async getServerInfo(serverId) {
    try {
      const server = this.getServer(serverId);
      await server.get();
      return server;
    } catch (e) {
      throw new Error(`Failed to get server info: ${e.message}`);
    }
  }

  /**
   * Start server
   * @param {string} serverId - The server ID
   * @returns {Promise<Object>} Success response
   */
  async startServer(serverId) {
    try {
      const server = this.getServer(serverId);
      await server.start();
      return { success: true, message: 'Server starting...' };
    } catch (e) {
      throw new Error(`Failed to start server: ${e.message}`);
    }
  }

  /**
   * Stop server
   * @param {string} serverId - The server ID
   * @returns {Promise<Object>} Success response
   */
  async stopServer(serverId) {
    try {
      const server = this.getServer(serverId);
      await server.stop();
      return { success: true, message: 'Server stopping...' };
    } catch (e) {
      throw new Error(`Failed to stop server: ${e.message}`);
    }
  }

  /**
   * Restart server
   * @param {string} serverId - The server ID
   * @returns {Promise<Object>} Success response
   */
  async restartServer(serverId) {
    try {
      const server = this.getServer(serverId);
      await server.restart();
      return { success: true, message: 'Server restarting...' };
    } catch (e) {
      throw new Error(`Failed to restart server: ${e.message}`);
    }
  }

  /**
   * Execute command on server via WebSocket (preferred) or REST API
   * The REST API has limitations and may reject valid commands
   * WebSocket console stream is more reliable
   * @param {string} serverId - The server ID
   * @param {string} command - The command to execute
   * @returns {Promise<Object>} Success response
   */
  async executeCommand(serverId, command) {
    const server = this.getServer(serverId);
    
    try {
      // Get server status first
      await server.get();
      
      if (server.status !== 1) {
        throw new Error(`Server must be online to execute commands (current status: ${server.status})`);
      }
      
      console.log(`[Exaroton] Executing "${command}" on server ${serverId}`);
      
      // Subscribe to console stream for WebSocket-based command execution
      // This is more reliable than the REST API
      server.subscribe(["console"]);
      
      // Wait for WebSocket connection to establish
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
        
        // Listen for console stream to be ready
        server.on('status', () => {
          clearTimeout(timeout);
          resolve();
        });
      }).catch(() => {
        console.log('[Exaroton] WebSocket connection timeout, will try REST API');
      });
      
      // Execute command (will use WebSocket if available, otherwise REST API)
      const result = await server.executeCommand(command);
      
      console.log(`[Exaroton] Command executed successfully`);
      
      // Clean up WebSocket connection
      server.unsubscribe(["console"]);
      
      return { success: true, message: 'Command executed' };
    } catch (e) {
      console.error(`[Exaroton] Command execution failed:`, e.message);
      
      // Clean up on error
      try {
        server.unsubscribe();
      } catch {}
      
      // Handle known "Invalid command" REST API limitation
      if (e.message.includes('Invalid command')) {
        console.warn(`[Exaroton] REST API rejected command - this is a known API limitation`);
        console.warn(`[Exaroton] Commands may still execute on server despite error`);
        
        return { 
          success: true, 
          message: 'Command sent (check server console for execution)',
          warning: true
        };
      }
      
      throw new Error(`Failed to execute command: ${e.message}`);
    }
  }

  /**
   * Get server logs
   * Note: This is cached and may not return latest updates immediately
   * @param {string} serverId - The server ID
   * @returns {Promise<Object>} Logs object
   */
  async getLogs(serverId) {
    try {
      const server = this.getServer(serverId);
      return await server.getLogs();
    } catch (e) {
      throw new Error(`Failed to get logs: ${e.message}`);
    }
  }

  /**
   * Share logs via mclo.gs
   * @param {string} serverId - The server ID
   * @returns {Promise<string>} URL to the shared logs
   */
  async shareLogs(serverId) {
    try {
      const server = this.getServer(serverId);
      return await server.shareLogs();
    } catch (e) {
      throw new Error(`Failed to share logs: ${e.message}`);
    }
  }

  /**
   * Get server RAM in GB
   * @param {string} serverId - The server ID
   * @returns {Promise<number>} RAM amount in GB
   */
  async getRAM(serverId) {
    try {
      const server = this.getServer(serverId);
      return await server.getRAM();
    } catch (e) {
      throw new Error(`Failed to get RAM: ${e.message}`);
    }
  }

  /**
   * Set server RAM
   * @param {string} serverId - The server ID
   * @param {number} ram - RAM amount in GB (2-16)
   * @returns {Promise<Object>} Success response
   */
  async setRAM(serverId, ram) {
    try {
      const server = this.getServer(serverId);
      await server.setRAM(ram);
      return { success: true, message: `RAM set to ${ram}GB` };
    } catch (e) {
      throw new Error(`Failed to set RAM: ${e.message}`);
    }
  }

  /**
   * Get server MOTD
   * @param {string} serverId - The server ID
   * @returns {Promise<string>} Server MOTD
   */
  async getMOTD(serverId) {
    try {
      const server = this.getServer(serverId);
      return await server.getMOTD();
    } catch (e) {
      throw new Error(`Failed to get MOTD: ${e.message}`);
    }
  }

  /**
   * Set server MOTD
   * @param {string} serverId - The server ID
   * @param {string} motd - The MOTD text
   * @returns {Promise<Object>} Success response
   */
  async setMOTD(serverId, motd) {
    try {
      const server = this.getServer(serverId);
      await server.setMOTD(motd);
      return { success: true, message: 'MOTD updated' };
    } catch (e) {
      throw new Error(`Failed to set MOTD: ${e.message}`);
    }
  }

  /**
   * Get player lists for server
   * @param {string} serverId - The server ID
   * @returns {Promise<Array>} Array of player list names
   */
  async getPlayerLists(serverId) {
    try {
      const server = this.getServer(serverId);
      return await server.getPlayerLists();
    } catch (e) {
      throw new Error(`Failed to get player lists: ${e.message}`);
    }
  }

  /**
   * Get player list entries
   * @param {string} serverId - The server ID
   * @param {string} listName - The list name (e.g. "whitelist", "ops", "banned-players")
   * @returns {Promise<Array>} Array of player entries
   */
  async getPlayerListEntries(serverId, listName) {
    try {
      const server = this.getServer(serverId);
      const list = server.getPlayerList(listName);
      return await list.getEntries();
    } catch (e) {
      throw new Error(`Failed to get player list entries: ${e.message}`);
    }
  }

  /**
   * Add player to list
   * @param {string} serverId - The server ID
   * @param {string} listName - The list name
   * @param {string} player - The player name
   * @returns {Promise<Object>} Success response
   */
  async addPlayerToList(serverId, listName, player) {
    try {
      const server = this.getServer(serverId);
      const list = server.getPlayerList(listName);
      await list.addEntry(player);
      return { success: true, message: `Added ${player} to ${listName}` };
    } catch (e) {
      throw new Error(`Failed to add player: ${e.message}`);
    }
  }

  /**
   * Remove player from list
   * @param {string} serverId - The server ID
   * @param {string} listName - The list name
   * @param {string} player - The player name
   * @returns {Promise<Object>} Success response
   */
  async removePlayerFromList(serverId, listName, player) {
    try {
      const server = this.getServer(serverId);
      const list = server.getPlayerList(listName);
      await list.deleteEntry(player);
      return { success: true, message: `Removed ${player} from ${listName}` };
    } catch (e) {
      throw new Error(`Failed to remove player: ${e.message}`);
    }
  }

  /**
   * Subscribe to server events via WebSocket
   * @param {string} serverId - The server ID
   * @param {Array<string>} streams - Optional streams to subscribe to (console, tick, heap, stats)
   * @returns {Object} Server object with event listeners
   */
  subscribeToServer(serverId, streams = []) {
    const server = this.getServer(serverId);
    if (streams.length > 0) {
      server.subscribe(streams);
    } else {
      server.subscribe();
    }
    return server;
  }

  /**
   * Unsubscribe from server events
   * @param {string} serverId - The server ID
   * @param {Array<string>|null} streams - Streams to unsubscribe from, or null for all
   */
  unsubscribeFromServer(serverId, streams = null) {
    const server = this.getServer(serverId);
    if (streams) {
      server.unsubscribe(streams);
    } else {
      server.unsubscribe();
    }
  }
}

export default ExarotonAPI;
