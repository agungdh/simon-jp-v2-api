# syntax=docker/dockerfile:1

# ---- Builder ----
FROM oven/bun:1.4 AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run db:generate

# ---- Runtime (distroless) ----
FROM oven/bun:1.4-distroless AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/src ./src
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

EXPOSE 3000
USER nonroot:nonroot
ENTRYPOINT ["/usr/local/bin/bun"]
CMD ["run", "src/index.ts"]
