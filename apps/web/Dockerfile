# syntax=docker/dockerfile:1.7
# Build context: repo root.
#   docker build -f apps/web/Dockerfile -t recipe-manager-web .

############################
# Stage 1: install dependencies
############################
FROM node:22-bookworm-slim AS deps
WORKDIR /app

RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN yarn install --immutable

############################
# Stage 2: build shared + web
############################
FROM node:22-bookworm-slim AS build
WORKDIR /app

RUN corepack enable

ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_UMAMI_SCRIPT_URL
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
ARG INTERNAL_API_URL
ENV NEXT_PUBLIC_UMAMI_SCRIPT_URL=$NEXT_PUBLIC_UMAMI_SCRIPT_URL
ENV NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID
ENV INTERNAL_API_URL=$INTERNAL_API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY package.json yarn.lock .yarnrc.yml tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN yarn workspace @recipe-manager/shared run build \
 && yarn workspace @recipe-manager/web run build

############################
# Stage 3: runtime
############################
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/apps/web/package.json ./apps/web/package.json
COPY --from=build /app/apps/web/next.config.ts ./apps/web/next.config.ts
COPY --from=build /app/apps/web/tsconfig.json ./apps/web/tsconfig.json
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public

RUN chown -R node:node /app
USER node

WORKDIR /app/apps/web
EXPOSE 3000
CMD ["/app/node_modules/.bin/next", "start"]
