# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Install dumb-init untuk signal handling yang lebih baik
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application dari builder stage
COPY --from=builder /app/build ./build

# Create non-root user untuk security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

USER nodejs

# Expose port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3333', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Gunakan dumb-init untuk menjalankan aplikasi
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
