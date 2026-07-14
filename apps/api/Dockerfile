# REVOG API — build from the REPO ROOT so workspaces resolve:
#   docker build -f apps/api/Dockerfile -t revog-api .
# (Railway: set "Dockerfile path" to apps/api/Dockerfile, root context.)

FROM node:22-alpine AS builder
WORKDIR /repo

# Install with the workspace-aware lockfile.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
RUN npm ci --workspace apps/api --include-workspace-root=false

COPY apps/api apps/api
RUN cd apps/api \
  && npx prisma generate \
  && npx nest build

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
