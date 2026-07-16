# REVOG API — build from the REPO ROOT so workspaces resolve:
#   docker build -f apps/api/Dockerfile -t revog-api .
# (Railway: set "Dockerfile path" to apps/api/Dockerfile, root context.)

FROM node:22-alpine AS builder
WORKDIR /repo

# Install the FULL monorepo from the lockfile. Copying every workspace's
# package.json + a plain `npm ci` is bulletproof against workspace-filter
# resolution quirks (a filtered `--workspace apps/api` install kept silently
# dropping deps like @aws-sdk/client-s3). Web deps come along too — a slightly
# bigger builder image, but a reliable one.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci

COPY apps/api apps/api
RUN cd apps/api \
  && npx prisma generate \
  && npx nest build \
  # npm workspaces hoist all deps to /repo/node_modules, so apps/api may have
  # no node_modules of its own. Guarantee the dir exists for the COPY below;
  # Node resolves up to the root node_modules at runtime anyway.
  && mkdir -p node_modules

# ---------------------------------------------------------------- runtime
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /repo/apps/api/dist ./apps/api/dist
COPY --from=builder /repo/apps/api/prisma ./apps/api/prisma
COPY --from=builder /repo/apps/api/package.json ./apps/api/

WORKDIR /app/apps/api
EXPOSE 3001

# Apply pending migrations on every release, then serve.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
