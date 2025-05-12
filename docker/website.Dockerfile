# 1) Dev stage
FROM node:22-alpine AS developer
WORKDIR /repo
ENV NODE_ENV=development

# Copy the entire repo to the container and remove the .gitignore file
# This mimics the behavior of gh pages and prevents setup mismatches between development and production
COPY . .
RUN rm .gitignore

RUN corepack enable \
    && pnpm install --frozen-lockfile
RUN pnpm run build:packages

EXPOSE 3000

# 2) Build stage
FROM node:22-alpine AS builder
WORKDIR /repo
COPY --from=developer /repo ./

# Build the monorepo (can only be built after all dependencies are installed)
RUN corepack enable && pnpm run build