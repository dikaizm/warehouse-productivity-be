# ---- Build Stage ----
    FROM node:20-slim AS builder
    WORKDIR /app
    COPY package.json package-lock.json ./
    RUN npm ci
    COPY . .
    RUN npm run build
    RUN npx prisma generate  # optional here
    
    # ---- Production Stage ----
    FROM node:20-slim
    WORKDIR /app
    
    ENV NODE_ENV=production
    
    RUN apt-get update -y && apt-get install -y openssl && apt-get clean && rm -rf /var/lib/apt/lists/*
    
    COPY package.json package-lock.json ./
    RUN npm ci --omit=dev
    
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/prisma ./prisma
    COPY --from=builder /app/public ./public
    
    EXPOSE 3000
    CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/index.js"]