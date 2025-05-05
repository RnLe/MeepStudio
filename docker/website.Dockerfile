# 1) Dev stage
FROM node:22-alpine AS developer
WORKDIR /repo
ENV NODE_ENV=development

# 1a) Copy workspace manifests & install
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json tsconfig.json ./
COPY packages packages/
COPY apps/website apps/website
# Install pnpm for faster package management; then install all dependencies
RUN corepack enable \
    && pnpm install

EXPOSE 3000

# 2) Build stage
FROM node:22-alpine AS builder
WORKDIR /repo

# Build the monorepo (can only be built after all dependencies are installed)
RUN pnpm turbo run build --filter=packages/**

# Build again. This time only the website; everthing else is cached (filter for website is implicit)
WORKDIR /repo/apps/website
RUN pnpm run build

# 3) Production stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/apps/website/.next .next
COPY --from=builder /repo/apps/website/public public
COPY --from=builder /repo/node_modules node_modules
COPY --from=builder /repo/apps/website/package.json .
EXPOSE 3000