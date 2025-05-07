# 1) Dev stage
FROM node:22-alpine AS developer
WORKDIR /repo
ENV NODE_ENV=development

# only what pnpm needs to calculate the lock‑file graph
COPY package.json pnpm-*.yaml turbo.json tsconfig*.json tailwind.config.js ./
COPY packages packages/
COPY apps/website apps/website/
# COPY . .
# RUN rm .gitignore

RUN corepack enable && pnpm install --frozen-lockfile

EXPOSE 3000

# 2) Build stage
FROM node:22-alpine AS builder
WORKDIR /repo
COPY --from=developer /repo ./

# Build the monorepo (can only be built after all dependencies are installed)
RUN corepack enable && pnpm run build