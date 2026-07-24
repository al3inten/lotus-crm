# ---- Build stage ----
FROM node:20-slim AS builder
# OpenSSL is required by Prisma's engine.
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install all deps (incl. dev) for the build + prisma generate.
COPY package*.json ./
RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:20-slim
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# node_modules (with the generated Prisma client + tsx for seeding), build output, prisma dir.
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Apply migrations, seed (non-fatal if already seeded), then start.
CMD ["sh", "-c", "npx prisma migrate deploy && (npx prisma db seed || echo 'seed skipped') && node dist/server.js"]
