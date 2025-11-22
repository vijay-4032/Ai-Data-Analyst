# ===========================================
# AI Analyst Frontend - Dockerfile
# ===========================================

# ----- Base Stage -----
    FROM node:18-alpine AS base

    # Install dependencies only when needed
    FROM base AS deps
    RUN apk add --no-cache libc6-compat
    WORKDIR /app
    
    # Copy package files
    COPY package.json ./
    
    # Install dependencies (use npm install since package-lock.json may not exist)
    RUN npm install --legacy-peer-deps
    
    
    # ----- Development Stage -----
    FROM base AS development
    WORKDIR /app
    
    COPY --from=deps /app/node_modules ./node_modules
    COPY . .
    
    # Expose port
    EXPOSE 3000
    
    # Set environment
    ENV NODE_ENV=development
    ENV NEXT_TELEMETRY_DISABLED=1
    
    # Start development server
    CMD ["npm", "run", "dev"]
    
    
    # ----- Builder Stage -----
    FROM base AS builder
    WORKDIR /app
    
    COPY --from=deps /app/node_modules ./node_modules
    COPY . .
    
    # Build the application
    ENV NEXT_TELEMETRY_DISABLED=1
    RUN npm run build
    
    
    # ----- Production Stage -----
    FROM base AS production
    WORKDIR /app
    
    ENV NODE_ENV=production
    ENV NEXT_TELEMETRY_DISABLED=1
    
    # Create non-root user
    RUN addgroup --system --gid 1001 nodejs
    RUN adduser --system --uid 1001 nextjs
    
    # Copy built assets
    COPY --from=builder /app/public ./public
    COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
    COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
    
    USER nextjs
    
    EXPOSE 3000
    
    ENV PORT=3000
    ENV HOSTNAME="0.0.0.0"
    
    CMD ["node", "server.js"]