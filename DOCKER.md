# Docker Deployment Guide

This guide explains how to run the Exaroton Control Panel using Docker.

## Prerequisites

- Docker installed (version 20.10 or later)
- Docker Compose installed (version 2.0 or later)
- Your `.env` file configured with all required tokens and settings

## Architecture

The application uses **separate Docker images** for each service:

- **Dashboard Image** (`Dockerfile`): Web dashboard on port 3000
- **Bot Image** (`Dockerfile.bot`): Discord bot (no ports needed)

Each service runs in its own isolated container with independent logs and resources.

## Quick Start

### 1. Build Both Images

```bash
docker-compose build
```

This builds two separate images:
- `exaroton-dashboard:latest`
- `exaroton-bot:latest`

### 2. Run with Docker Compose (Recommended)

Start both services in separate containers:

```bash
docker-compose up -d
```

### 3. Check Status

```bash
docker-compose ps
```

### 4. View Logs

```bash
# All services
docker-compose logs -f

# Dashboard only
docker-compose logs -f dashboard

# Bot only
docker-compose logs -f bot
```

### 5. Stop Services

```bash
docker-compose down
```

## Running Individual Services

### Web Dashboard Only

```bash
# Build dashboard image
docker build -t exaroton-dashboard -f Dockerfile .

# Run dashboard container
docker run -d \
  --name exaroton-dashboard \
  -p 3000:3000 \
  --env-file .env \
  -v ./logs/dashboard:/app/logs \
  exaroton-dashboard
```

### Discord Bot Only

```bash
# Build bot image
docker build -t exaroton-bot -f Dockerfile.bot .

# Run bot container
docker run -d \
  --name exaroton-bot \
  --env-file .env \
  -v ./logs/bot:/app/logs \
  exaroton-bot
```

## Environment Variables

Make sure your `.env` file contains:

```env
# Exaroton API
EXAROTON_API_TOKEN=your_token_here
DEFAULT_SERVER_ID=your_server_id_here

# Web Server
PORT=3000
NODE_ENV=production

# Discord Bot
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_REQUIRED_ROLE=Bot
DISCORD_START_ROLE=Approved
TEMPBAN_COMMAND_FORMAT=tempban {player} 30m {reason}
```

## Port Mapping

- `3000`: Web dashboard (HTTP)

The Discord bot doesn't require any ports.

## Volume Mounts

The `docker-compose.yml` includes a volume mount for logs:

- `./logs:/app/logs` - Application logs

## Production Considerations

### Using Docker Secrets

For production, consider using Docker secrets instead of environment variables:

```yaml
services:
  bot:
    secrets:
      - exaroton_token
      - discord_token

secrets:
  exaroton_token:
    external: true
  discord_token:
    external: true
```

### Health Checks

Add health checks to your services:

```yaml
services:
  dashboard:
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Resource Limits

Set resource limits to prevent memory/CPU overuse:

```yaml
services:
  dashboard:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          memory: 256M
```

## Updating

### Rebuild and Restart Both Services

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Update Specific Service

```bash
# Update dashboard only
docker-compose stop dashboard
docker-compose build --no-cache dashboard
docker-compose up -d dashboard

# Update bot only
docker-compose stop bot
docker-compose build --no-cache bot
docker-compose up -d bot
```

### Pull Updates from Git

```bash
git pull
docker-compose down
docker-compose build
docker-compose up -d
```

## Troubleshooting

### Container Won't Start

Check logs:
```bash
docker-compose logs
```

### Permission Issues

Ensure `.env` file has correct permissions:
```bash
chmod 600 .env
```

### Network Issues

Recreate network:
```bash
docker-compose down
docker network prune
docker-compose up -d
```

### Clear Everything and Restart

```bash
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

## Monitoring

### Resource Usage

```bash
docker stats
```

### Container Inspection

```bash
docker inspect exaroton-dashboard
docker inspect exaroton-bot
```

## Backup

### Backup Configuration

```bash
cp .env .env.backup
```

### Export Logs

```bash
docker-compose logs > logs_backup.txt
```

## Advanced Usage

### Custom Network

```bash
docker network create exaroton-net
docker run -d --network exaroton-net --name dashboard exaroton-control-panel
```

### Using Docker Swarm

For high availability:

```bash
docker swarm init
docker stack deploy -c docker-compose.yml exaroton
```

## Security Best Practices

1. **Never commit `.env` file** - Keep tokens secure
2. **Use read-only root filesystem** when possible
3. **Run as non-root user** - Add to Dockerfile:
   ```dockerfile
   USER node
   ```
4. **Keep images updated** - Rebuild regularly for security patches
5. **Use secrets management** - Docker secrets or external vault
6. **Limit network exposure** - Only expose necessary ports
7. **Enable security scanning** - Use `docker scan` command

## Performance Tips

1. **Multi-stage builds** - Reduce image size
2. **Use alpine images** - Already using `node:22-alpine`
3. **Minimize layers** - Combine RUN commands
4. **Use .dockerignore** - Already configured
5. **Cache npm dependencies** - Already optimized in Dockerfile

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Verify `.env` configuration
3. Ensure tokens are valid
4. Check network connectivity
5. Review GitHub issues

## License

See LICENSE file in the repository.
