# syntax=docker/dockerfile:1.7
# Build context: repo root.
#   docker build -f apps/api/Dockerfile -t recipe-manager-api .

############################
# Stage 1: install dependencies
############################
FROM node:22-bookworm-slim AS deps
WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && corepack enable

COPY package.json yarn.lock .yarnrc.yml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN yarn install --immutable

############################
# Stage 2: build shared + api
############################
FROM node:22-bookworm-slim AS build
WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY package.json yarn.lock .yarnrc.yml tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN yarn workspace @recipe-manager/shared run build \
 && yarn workspace @recipe-manager/api exec prisma generate \
 && yarn workspace @recipe-manager/api run build

############################
# Stage 3: runtime
############################
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma

RUN mkdir -p /app/apps/api/uploads \
 && chown -R node:node /app
USER node

WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/main"]
