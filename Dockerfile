# Stage 1: Install dependencies
FROM node:24-slim AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Build the app
FROM node:24-slim AS build
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

# Fix TailwindCSS v4 hash mismatch between server/client Vite environments.
# Patches server JS files to reference actual client asset filenames.
RUN sh scripts/sync-assets.sh

# Stage 3: Production image
FROM node:24-slim AS production
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/generated ./generated
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/entry.server.js ./
COPY --from=build /app/package.json ./

EXPOSE 3000

CMD ["sh", "-c", "pnpm prisma migrate deploy && node entry.server.js"]
