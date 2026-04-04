# ============================================================
# Stage 1: Install dependencies
# ============================================================
FROM node:22-alpine AS deps

# Check https://github.com/nodejs/docker-node#nodealpine for why libc6-compat is needed
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy dependency manifests only — maximizes Docker layer cache
COPY package.json package-lock.json ./

# Install ALL dependencies (devDeps needed for the build stage)
RUN npm ci

# ============================================================
# Stage 2: Build the Next.js application
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Bring in installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the full source tree
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the standalone production bundle
RUN npm run build

# ============================================================
# Stage 3: Production runtime (minimal image)
# ============================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the public folder (static assets like images, SVGs)
COPY --from=builder /app/public ./public

# Create the .next directory owned by nextjs user (for cache at runtime)
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy the standalone server and static build output
# standalone/ contains a minimal Node.js server + only required node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port 3000 (Next.js default)
EXPOSE 3000

# Set the hostname to listen on all interfaces inside the container
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Start the standalone Next.js server
CMD ["node", "server.js"]
