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
COPY container-start.js ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Startup wrapper: non-destructive schema sync, seed ONLY on first boot (empty DB), then start.
# Seeding once — not every redeploy — avoids resetting demo-user edits. Data persists in the
# db_data volume regardless. See container-start.js.
CMD ["node", "container-start.js"]
