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

# Expose port for web dashboard
EXPOSE 3000

# Create volume mount point for environment variables
VOLUME ["/app/.env"]

# Default command runs the web server
# Use docker-compose or override to run the bot
CMD ["npm", "start"]
