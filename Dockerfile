# MahPari shop: production image (multi-stage, Next.js standalone output)
#
# NODE_IMAGE can point at a mirror if Docker Hub is not reachable from the server:
#   docker compose build --build-arg NODE_IMAGE=<mirror>/node:22-alpine
ARG NODE_IMAGE=node:22-alpine

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
ARG NPM_REGISTRY=https://registry.npmjs.org/
COPY package.json ./
RUN npm install --no-audit --no-fund --registry=${NPM_REGISTRY}

# Database tools: migrations and seed (used by the `migrate` service in docker-compose.yml)
FROM ${NODE_IMAGE} AS tools
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY db ./db
COPY scripts ./scripts
CMD ["node", "scripts/migrate.mjs"]

FROM ${NODE_IMAGE} AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 NEXT_OUTPUT=standalone
# Set only when photos are served from ArvanCloud / a CDN instead of the server disk (see lib/media.ts)
ARG NEXT_PUBLIC_MEDIA_BASE_URL=
ENV NEXT_PUBLIC_MEDIA_BASE_URL=$NEXT_PUBLIC_MEDIA_BASE_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM ${NODE_IMAGE} AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
# Migrations and seed, so a platform pre-deploy step can run `node scripts/migrate.mjs` (pg is already in standalone node_modules)
COPY --from=build --chown=app:app /app/db ./db
COPY --from=build --chown=app:app /app/scripts ./scripts
# Product photos live in a volume (see docker-compose.yml) that the app user can write to
ENV UPLOAD_DIR=/uploads
RUN mkdir -p /uploads && chown app:app /uploads
USER app
EXPOSE 3000
CMD ["node", "server.js"]
