# -------- build stage --------
FROM node:22-bookworm-slim AS build

# 0. Enable TLS trust store
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# install wine for Windows builds
RUN dpkg --add-architecture i386 \
 && apt-get update \
 && apt-get install -y --no-install-recommends \
      wine64 wine32 cabextract icnsutils graphicsmagick \
 && rm -rf /var/lib/apt/lists/*

# 1. Build the Next.js frontend
WORKDIR /frontend
COPY ../frontend/package*.json ./
RUN npm i --omit=dev
COPY ../frontend .
RUN npm run build

# 2. Build the Electron app
WORKDIR /app
COPY electron/package*.json ./
RUN npm i --omit=optional
COPY electron .
RUN rm -rf dist/renderer \
    && mkdir -p dist/renderer \
    && cp -R /frontend/out/* dist/renderer/
RUN npx tsc -p tsconfig.json --listEmittedFiles
RUN echo "=== /app/dist ===" && ls -R dist
RUN mv dist/app/src/preload.js dist/preload.js
RUN npx electron-builder --publish never

# -------- artifact stage --------
FROM alpine:3.21 AS artifacts
WORKDIR /dist
COPY --from=build /app/dist /dist