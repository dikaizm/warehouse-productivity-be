# ---- Build Stage ----
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npx prisma generate
# Compile the Prisma seed (TypeScript) into JS so production image can run it without ts-node
RUN npx tsc prisma/seed.ts --outDir dist/prisma --module commonjs --target ES2020 || true

# ---- Production Stage ----
FROM node:20-slim
WORKDIR /app

ENV NODE_ENV=production

# Set timezone to Asia/Jakarta
RUN apt-get update && apt-get install -y tzdata && rm -rf /var/lib/apt/lists/*
ENV TZ=Asia/Jakarta

RUN apt-get update -y && apt-get install -y openssl && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
# Copy prisma schema and migrations for Prisma CLI/runtime
COPY --from=builder /app/prisma ./prisma
# Copy the compiled JS seed (if produced) into the production prisma folder (after copying prisma)
COPY --from=builder /app/dist/prisma/seed.js ./prisma/seed.js
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["sh", "-c", "npx prisma generate && (npx prisma migrate deploy || npx prisma db push) && (node prisma/seed.js || echo 'no compiled seed found') && node dist/server.js"]