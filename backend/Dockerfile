# syntax=docker/dockerfile:1
FROM node:24-slim AS base
# openssl dibutuhkan schema engine Prisma (migrate deploy).
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# ---- deps: di-cache selama lockfile tidak berubah ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Cache store pnpm antar build: rebuild cepat & build yang gagal karena jaringan bisa dilanjutkan.
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---- build: prisma generate + nest build ----
FROM deps AS build
COPY . .
RUN pnpm build

# ---- runtime ----
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
# Trade-off: node_modules lengkap (termasuk devDependencies) ikut ke image agar
# `prisma migrate deploy` dan seeder (`tsx`) bisa dijalankan saat container start.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/src ./src
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/package.json /app/prisma.config.ts /app/tsconfig.json /app/docker-entrypoint.sh ./
USER node
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://localhost:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
