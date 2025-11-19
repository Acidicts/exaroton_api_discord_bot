# Docker Deployment Guide

This guide explains how to run the Exaroton Control Panel using Docker.

## Prerequisites

- Docker installed (version 20.10 or later)
- Docker Compose installed (version 2.0 or later)
- Your `.env` file configured with all required tokens and settings

## Architecture

The application uses a **unified Docker image** that can run in two modes:

- **API Mode** (`RUN_MODE=api`): Web dashboard and REST API on port 3000
- **Bot Mode** (`RUN_MODE=bot`): Discord bot (no ports needed)

The same Docker image (`exaroton-app:latest`) is used for both services. The `RUN_MODE` environment variable determines which application starts. This provides:
- Single image to build and maintain
- Consistent dependencies across services
- Smaller total disk usage
- Simplified updates and deployment

## Quick Start

### 1. Build the Image

```bash
docker-compose build
```

This builds a single unified image:
- `exaroton-app:latest`

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
docker-compose up -d dashboard
```

Or run standalone:

```bash
docker run -d \
  --name exaroton-dashboard \
  -p 3000:3000 \
  --env-file .env \
  -e RUN_MODE=api \
  -v $(pwd)/logs/dashboard:/app/logs \
  exaroton-app:latest
```

### Discord Bot Only

```bash
docker-compose up -d bot
```

Or run standalone:

```bash
docker run -d \
  --name exaroton-bot \
  --env-file .env \
  -e RUN_MODE=bot \
  -v $(pwd)/logs/bot:/app/logs \
  exaroton-app:latest
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

**Docker-specific variables** (set in `docker-compose.yml`, not in `.env`):
- `RUN_MODE`: Set to `api` for dashboard or `bot` for Discord bot
- This variable determines which application the container runs

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

### Rebuild and Restart All Services

```bash
# Pull latest code
git pull

# Rebuild the image
docker-compose build --no-cache

# Restart both services
docker-compose down
docker-compose up -d
```

### Restart Individual Service

Since both services share the same image, you only need to rebuild once:

```bash
# Rebuild the shared image
docker-compose build --no-cache

# Restart dashboard only
docker-compose restart dashboard

# Or restart bot only
docker-compose restart bot
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
