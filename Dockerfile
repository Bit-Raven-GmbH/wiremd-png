# ──────────────────────────────────────────────────────────────────────────────
# wiremd-png
# Converts WireMD (.md) wireframe files → PNG via wiremd + headless Chromium
#
# Build:
#   docker build -t wiremd-png .
#
# Usage:
#   docker run --rm -v $(pwd):/data wiremd-png /data/mockup.md
#   docker run --rm -v $(pwd):/data wiremd-png /data/mockup.md /data/out.png --style=clean
# ──────────────────────────────────────────────────────────────────────────────

FROM node:24-slim

LABEL org.opencontainers.image.title="wiremd-png" \
      org.opencontainers.image.description="WireMD (.md) → PNG renderer" \
      org.opencontainers.image.licenses="MIT"

# ── System dependencies for headless Chromium ────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      fonts-liberation \
      fonts-noto \
      fonts-noto-cjk \
      libatk-bridge2.0-0 \
      libatk1.0-0 \
      libcups2 \
      libdbus-1-3 \
      libdrm2 \
      libgbm1 \
      libglib2.0-0 \
      libnspr4 \
      libnss3 \
      libx11-6 \
      libx11-xcb1 \
      libxcb1 \
      libxcomposite1 \
      libxdamage1 \
      libxext6 \
      libxfixes3 \
      libxrandr2 \
      libxshmfence1 \
      xdg-utils \
   && rm -rf /var/lib/apt/lists/*

# ── Install wiremd + puppeteer globally ───────────────────────────────────────
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm install -g wiremd@0.1.5 puppeteer@24.38.0

# Make globally installed modules available to require()
ENV NODE_PATH=/usr/local/lib/node_modules

# ── Puppeteer: use system Chromium ────────────────────────────────────────────
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# ── WireMD defaults ───────────────────────────────────────────────────────────
ENV WIREMD_STYLE=sketch
ENV WIREMD_WIDTH=0
ENV WIREMD_HEIGHT=0

# ── Copy render script ────────────────────────────────────────────────────────
WORKDIR /app
COPY render.js ./

# ── Run as non-root for security and create data dir ──────────────────────────
RUN mkdir /data

RUN groupadd -r wiremd && useradd -r -g wiremd -G audio,video wiremd \
 && mkdir -p /home/wiremd/Downloads \
 && chown -R wiremd:wiremd /home/wiremd \
 && chown -R wiremd:wiremd /app \
 && chown -R wiremd:wiremd /data

USER wiremd

# ── Entrypoint ────────────────────────────────────────────────────────────────
WORKDIR /data
ENTRYPOINT ["node", "/app/render.js"]
CMD ["--help"]