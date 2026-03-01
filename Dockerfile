FROM node:22-slim AS base

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Production image
FROM node:22-slim AS runner
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/next.config.ts ./

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3000

ENV DATABASE_PATH=/app/data/finance.db
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

CMD ["npm", "start"]
