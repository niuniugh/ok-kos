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

# Sync CSS hashes: server and client builds may produce different Tailwind CSS hashes.
# Copy the client CSS file to match the filename the server expects.
RUN SERVER_CSS=$(grep -roh 'styles-[A-Za-z0-9_-]*\.css' dist/server/ | head -1) && \
    CLIENT_CSS=$(ls dist/client/assets/styles-*.css | head -1) && \
    if [ -n "$SERVER_CSS" ] && [ -n "$CLIENT_CSS" ] && [ "$(basename "$CLIENT_CSS")" != "$SERVER_CSS" ]; then \
      cp "$CLIENT_CSS" "dist/client/assets/$SERVER_CSS"; \
    fi

# Stage 3: Production image
FROM node:24-slim AS production
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
