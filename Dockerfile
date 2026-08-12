# Stage 1: Generate ML artifacts during build so runtime startup is instant
FROM python:3.11-slim AS ml

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ /app/src/
COPY data/ /app/data/
COPY edge/ /app/edge/
COPY results/ /app/results/

# Run the full pipeline once at build time
RUN python -m data.synthetic_generator && \
    python -m src.data_pipeline && \
    python -m src.train && \
    python -m src.evaluate && \
    python -m src.export_edge_model && \
    python -m src.export_farmer_feed

# Stage 2: Build Next.js dashboard
FROM node:20-slim AS web

WORKDIR /app/dashboard

COPY dashboard/package*.json ./
RUN npm ci

COPY dashboard/ ./
RUN npm run build

# Stage 3: Production — serve pre-built dashboard with pre-built artifacts
FROM node:20-slim

WORKDIR /app

# Built dashboard + node_modules
COPY --from=web /app/dashboard /app/dashboard

# Pre-generated ML artifacts (CSV + JSON + exported model)
COPY --from=ml /app/data/ /app/data/
COPY --from=ml /app/results/ /app/results/
COPY --from=ml /app/edge/ /app/edge/

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

CMD ["sh", "-c", "cd /app/dashboard && npm run start"]
