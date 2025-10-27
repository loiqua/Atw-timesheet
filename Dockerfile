# ========================================
# Multi-stage Dockerfile for ATW Timesheet
# ========================================

# ----------------------------------------
# Stage 1: Base image with dependencies
# ----------------------------------------
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies for Prisma
RUN apk add --no-cache libc6-compat openssl

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/frontend/package*.json ./apps/frontend/

# Install dependencies
RUN npm ci

# ----------------------------------------
# Stage 2: Build backend (API)
# ----------------------------------------
FROM base AS api-builder
WORKDIR /app

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy backend source
COPY apps/api ./apps/api

# Build backend
RUN npm run build --workspace=api

# ----------------------------------------
# Stage 3: Build frontend
# ----------------------------------------
FROM base AS frontend-builder
WORKDIR /app

# Copy frontend source
COPY apps/frontend ./apps/frontend

# Build frontend
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=frontend

# ----------------------------------------
# Stage 4: Production API image
# ----------------------------------------
FROM node:20-alpine AS api-production
WORKDIR /app

# Install production dependencies only
RUN apk add --no-cache libc6-compat openssl
RUN npm i -g tsx

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install production dependencies
RUN npm ci --omit=dev --workspace=api

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy built backend
COPY --from=api-builder /app/apps/api/dist ./apps/api/dist

# Copy email templates
COPY apps/api/templates ./apps/api/templates

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "require('http').get('http://localhost:8000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]

# Start backend (exec form)
CMD ["node", "apps/api/dist/main.js"]

# ----------------------------------------
# Stage 5: Production Frontend image
# ----------------------------------------
FROM node:20-alpine AS frontend-production
WORKDIR /app

# Install production dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./
COPY apps/frontend/package*.json ./apps/frontend/

# Install production dependencies
RUN npm ci --omit=dev --workspace=frontend

# Copy built frontend
COPY --from=frontend-builder /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=frontend-builder /app/apps/frontend/public ./apps/frontend/public
COPY apps/frontend/next.config.* ./apps/frontend/

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]

# Start frontend (exec form)
CMD ["npm", "run", "start", "--workspace=frontend"]
