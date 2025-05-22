# 1) Dev stage
FROM node:22-alpine AS developer

# Prepare rust installation
RUN apk add --no-cache \
      build-base \
      curl \
      git \
      openssl-dev \
      musl-dev \
      llvm \
      clang \
      cmake

# install rustup (non-interactive), set up PATH
ENV CARGO_HOME=/root/.cargo
ENV PATH="${CARGO_HOME}/bin:/usr/local/bin:${PATH}"
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y --no-modify-path \
 && rustup default stable \
 && rustup target add wasm32-unknown-unknown \
 && cargo install wasm-pack

WORKDIR /repo
ENV NODE_ENV=development

# Copy the entire repo to the container and remove the .gitignore file
# This mimics the behavior of gh pages and prevents setup mismatches between development and production
COPY . .
RUN rm .gitignore

RUN corepack enable \
    && pnpm install --frozen-lockfile
RUN pnpm run build:packages

# build the WASM bundle into apps/website/pkg
WORKDIR /repo/apps/website/wasm
# wasm-pack emits into ../pkg
RUN wasm-pack build \
      --target bundler \
      --out-dir ../pkg \
      --dev

# switch back to website root for dev server
WORKDIR /repo/apps/website

EXPOSE 3000

# 2) Build stage (Node only)
FROM node:22-alpine AS builder
WORKDIR /repo
COPY --from=developer /repo ./

# Build the monorepo (can only be built after all dependencies are installed)
RUN corepack enable && pnpm run build