// WebSocket connection
let ws = null;
let currentServerId = null;
let currentPlayerList = 'whitelist';

// API base URL
const API_BASE = window.location.origin + '/api';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    connectWebSocket();
});

// Initialize app
async function initializeApp() {
    try {
        await loadAccount();
        await loadServers();
    } catch (error) {
        showNotification('Failed to initialize app: ' + error.message, 'error');
    }
}

// Load account information
async function loadAccount() {
    try {
        const response = await fetch(`${API_BASE}/account`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('accountName').textContent = data.data.name;
            document.getElementById('accountCredits').textContent = `${data.data.credits} Credits`;
        }
    } catch (error) {
        console.error('Failed to load account:', error);
    }
}

// Load servers
async function loadServers() {
    try {
        const response = await fetch(`${API_BASE}/servers`);
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('serverSelect');
            select.innerHTML = '<option value="">Select a server...</option>';
            
            data.data.forEach(server => {
                const option = document.createElement('option');
                option.value = server.id;
                option.textContent = `${server.name} (${server.id})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        showNotification('Failed to load servers: ' + error.message, 'error');
    }
}

// Load server info
async function loadServerInfo(serverId) {
    try {
        const response = await fetch(`${API_BASE}/servers/${serverId}`);
        const data = await response.json();
        
        if (data.success) {
            updateServerDisplay(data.data);
        }
    } catch (error) {
        showNotification('Failed to load server info: ' + error.message, 'error');
    }
}

// Update server display
function updateServerDisplay(server) {
    const statusMap = {
        0: 'Offline',
        1: 'Online',
        2: 'Starting',
        3: 'Stopping',
        4: 'Restarting',
        5: 'Saving',
        6: 'Loading',
        7: 'Crashed',
        8: 'Pending',
        10: 'Preparing'
    };

    const status = statusMap[server.status] || 'Unknown';
    const statusElement = document.getElementById('serverStatus');
    statusElement.textContent = status;
    statusElement.className = 'status-badge';
    
    if (server.status === 1) {
        statusElement.classList.add('online');
    } else if (server.status === 0 || server.status === 7) {
        statusElement.classList.add('offline');
    } else {
        statusElement.classList.add('starting');
    }

    document.getElementById('serverAddress').textContent = server.address || '--';
    document.getElementById('serverMotd').textContent = server.motd || '--';
    document.getElementById('serverPlayers').textContent = server.players 
        ? `${server.players.count}/${server.players.max}` 
        : '--';
    document.getElementById('serverRam').textContent = server.ram ? `${server.ram} GB` : '--';
    document.getElementById('serverSoftware').textContent = server.software 
        ? `${server.software.name} ${server.software.version}` 
        : '--';

    // Update button states
    const isOnline = server.status === 1;
    const isOffline = server.status === 0;
    const isTransitioning = server.status >= 2 && server.status <= 6;

    document.getElementById('startBtn').disabled = !isOffline || isTransitioning;
    document.getElementById('stopBtn').disabled = !isOnline || isTransitioning;
    document.getElementById('restartBtn').disabled = !isOnline || isTransitioning;
    document.getElementById('sendCommand').disabled = !isOnline;
    document.getElementById('commandInput').disabled = !isOnline;

    // Update RAM input
    if (server.ram) {
        document.getElementById('ramInput').value = server.ram;
    }

    // Update MOTD input
    if (server.motd) {
        document.getElementById('motdInput').value = server.motd;
    }
}

// Server control actions
async function startServer() {
    if (!currentServerId) return;
    
    try {
        const response = await fetch(`${API_BASE}/servers/${currentServerId}/start`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            showNotification('Server starting...', 'success');
            setTimeout(() => loadServerInfo(currentServerId), 2000);
        } else {
            showNotification('Failed to start server: ' + data.error, 'error');
        }
    } catch (error) {
        showNotification('Error starting server: ' + error.message, 'error');
    }
}

async function stopServer() {
    if (!currentServerId) return;
    
    try {
        const response = await fetch(`${API_BASE}/servers/${currentServerId}/stop`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            showNotification('Server stopping...', 'success');
            setTimeout(() => loadServerInfo(currentServerId), 2000);
        } else {
            showNotification('Failed to stop server: ' + data.error, 'error');
        }
    } catch (error) {
        showNotification('Error stopping server: ' + error.message, 'error');
    }
}

async function restartServer() {
    if (!currentServerId) return;
    
    try {
        const response = await fetch(`${API_BASE}/servers/${currentServerId}/restart`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            showNotification('Server restarting...', 'success');
            setTimeout(() => loadServerInfo(currentServerId), 2000);
        } else {
            showNotification('Failed to restart server: ' + data.error, 'error');
        }
    } catch (error) {
        showNotification('Error restarting server: ' + error.message, 'error');
    }
}

// Send command
async function sendCommand() {
    const input = document.getElementById('commandInput');
    const command = input.value.trim();
    
    if (!command || !currentServerId) return;
    
    try {
        const response = await fetch(`${API_BASE}/servers/${currentServerId}/command`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command })
        });
        const data = await response.json();
        
        if (data.success) {
            addConsoleLog(`> ${command}`);
            input.value = '';
        } else {
            showNotification('Failed to send command: ' + data.error, 'error');
        }
    } catch (error) {
        showNotification('Error sending command: ' + error.message, 'error');
    }
}

// Console log
function addConsoleLog(message) {
    const console = document.getElementById('console');
    const line = document.createElement('div');
    line.className = 'console-line';
    line.textContent = message;
    console.appendChild(line);
    console.scrollTop = console.scrollHeight;
}

// Set RAM
async function setRAM() {
    const ram = parseInt(document.getElementById('ramInput').value);
    
    if (!ram || ram < 2 || ram > 16 || !currentServerId) {
        showNotification('RAM must be between 2 and 16 GB', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/servers/${currentServerId}/ram`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ram })
        });
        const data = await response.json();
        
        if (data.success) {
            showNotification('RAM updated successfully', 'success');
            loadServerInfo(currentServerId);
        } else {
            showNotification('Failed to set RAM: ' + data.error, 'error');
        }
    } catch (error) {
        showNotification('Error setting RAM: ' + error.message, 'error');
    }
}

// Set MOTD
async function setMOTD() {
    const motd = document.getElementById('motdInput').value.trim();
    
    if (!motd || !currentServerId) {
        showNotification('MOTD cannot be empty', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/servers/${currentServerId}/motd`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ motd })
        });
        const data = await response.json();
        
        if (data.success) {
            showNotification('MOTD updated successfully', 'success');
            loadServerInfo(currentServerId);
        } else {
            showNotification('Failed to set MOTD: ' + data.error, 'error');
        }
    } catch (error) {
        showNotification('Error setting MOTD: ' + error.message, 'error');
    }
}

// Load player list
async function loadPlayerList() {
    if (!currentServerId) return;
    
    try {
        const response = await fetch(`${API_BASE}/servers/${currentServerId}/players/${currentPlayerList}`);
        const data = await response.json();
        
        if (data.success) {
            const listElement = document.getElementById('playerList');
            listElement.innerHTML = '';
            
            if (data.data.length === 0) {
                listElement.innerHTML = '<p style="color: #a0a0a0; text-align: center;">No players in this list</p>';
            } else {
                data.data.forEach(player => {
                    const item = document.createElement('div');
                    item.className = 'player-item';
                    item.innerHTML = `
                        <span>${player.name || player}</span>
                        <button onclick="removePlayer('${player.name || player}')">Remove</button>
                    `;
                    listElement.appendChild(item);
                });
            }
        }
    } catch (error) {
        console.error('Failed to load player list:', error);
    }
}

// Add player
async function addPlayer() {
    const input = document.getElementById('playerNameInput');
    const playerName = input.value.trim();
    
    if (!playerName || !currentServerId) return;
    
    try {
        const response = await fetch(`${API_BASE}/servers/${currentServerId}/players/${currentPlayerList}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player: playerName })
        });
        const data = await response.json();
        
        if (data.success) {
            showNotification(`Added ${playerName} to ${currentPlayerList}`, 'success');
            input.value = '';
            loadPlayerList();
        } else {
            showNotification('Failed to add player: ' + data.error, 'error');
        }
    } catch (error) {
        showNotification('Error adding player: ' + error.message, 'error');
    }
}

// Remove player
async function removePlayer(playerName) {
    if (!currentServerId) return;
    
    try {
        const response = await fetch(`${API_BASE}/servers/${currentServerId}/players/${currentPlayerList}/${playerName}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        
        if (data.success) {
            showNotification(`Removed ${playerName} from ${currentPlayerList}`, 'success');
            loadPlayerList();
        } else {
            showNotification('Failed to remove player: ' + data.error, 'error');
        }
    } catch (error) {
        showNotification('Error removing player: ' + error.message, 'error');
    }
}

// View logs
async function viewLogs() {
    if (!currentServerId) return;
    
    try {
        const response = await fetch(`${API_BASE}/servers/${currentServerId}/logs`);
        const data = await response.json();
        
        if (data.success) {
            const logsContent = document.getElementById('logsContent');
            logsContent.textContent = data.data.content || 'No logs available';
            logsContent.style.display = 'block';
        } else {
            showNotification('Failed to load logs: ' + data.error, 'error');
        }
    } catch (error) {
        showNotification('Error loading logs: ' + error.message, 'error');
    }
}

// Share logs
async function shareLogs() {
    if (!currentServerId) return;
    
    try {
        const response = await fetch(`${API_BASE}/servers/${currentServerId}/logs/share`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            window.open(data.data.url, '_blank');
            showNotification('Logs shared successfully', 'success');
        } else {
            showNotification('Failed to share logs: ' + data.error, 'error');
        }
    } catch (error) {
        showNotification('Error sharing logs: ' + error.message, 'error');
    }
}

// WebSocket connection
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}`);
    
    ws.onopen = () => {
        updateWSStatus(true);
        showNotification('Connected to server', 'success');
        
        if (currentServerId) {
            ws.send(JSON.stringify({ type: 'subscribe', serverId: currentServerId }));
        }
    };
    
    ws.onclose = () => {
        updateWSStatus(false);
        showNotification('Disconnected from server', 'error');
        
        // Reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    };
}

// Handle WebSocket messages
function handleWebSocketMessage(message) {
    switch (message.type) {
        case 'status':
            if (message.data) {
                updateServerDisplay({ ...message.data, status: message.data.status });
            }
            break;
            
        case 'console':
            if (message.data) {
                addConsoleLog(message.data.line || message.data);
            }
            break;
            
        case 'tick':
            if (message.data) {
                document.getElementById('tps').textContent = message.data.tps?.toFixed(2) || '--';
            }
            break;
            
        case 'heap':
            if (message.data) {
                const usage = ((message.data.usage / message.data.max) * 100).toFixed(1);
                document.getElementById('heapUsage').textContent = `${usage}%`;
            }
            break;
            
        case 'players':
            if (message.data) {
                document.getElementById('onlinePlayers').textContent = message.data.count || '0';
            }
            break;
    }
}

// Update WebSocket status
function updateWSStatus(connected) {
    const status = document.getElementById('wsStatus');
    status.textContent = '●';
    status.className = 'ws-status ' + (connected ? 'connected' : 'disconnected');
    status.title = connected ? 'Connected' : 'Disconnected';
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Event listeners
function setupEventListeners() {
    // Server selection
    document.getElementById('serverSelect').addEventListener('change', (e) => {
        currentServerId = e.target.value;
        
        if (currentServerId) {
            loadServerInfo(currentServerId);
            loadPlayerList();
            
            // Subscribe to WebSocket updates
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'subscribe', serverId: currentServerId }));
            }
        }
    });
    
    document.getElementById('refreshServers').addEventListener('click', loadServers);
    
    // Server controls
    document.getElementById('startBtn').addEventListener('click', startServer);
    document.getElementById('stopBtn').addEventListener('click', stopServer);
    document.getElementById('restartBtn').addEventListener('click', restartServer);
    
    // Console
    document.getElementById('sendCommand').addEventListener('click', sendCommand);
    document.getElementById('commandInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendCommand();
    });
    
    // RAM & MOTD
    document.getElementById('setRamBtn').addEventListener('click', setRAM);
    document.getElementById('setMotdBtn').addEventListener('click', setMOTD);
    
    // Player lists
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentPlayerList = e.target.dataset.list;
            loadPlayerList();
        });
    });
    
    document.getElementById('addPlayerBtn').addEventListener('click', addPlayer);
    document.getElementById('playerNameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPlayer();
    });
    
    // Logs
    document.getElementById('viewLogsBtn').addEventListener('click', viewLogs);
    document.getElementById('shareLogsBtn').addEventListener('click', shareLogs);
}

// Make removePlayer available globally
window.removePlayer = removePlayer;
