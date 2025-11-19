# Use Node.js 22 as specified in requirements
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port for web dashboard (only used when RUN_MODE=api)
EXPOSE 3000

# Start script that checks RUN_MODE environment variable from .env
# RUN_MODE=api -> runs npm start (web dashboard)
# RUN_MODE=bot -> runs npm run bot (Discord bot)
CMD ["node", "start.js"]
