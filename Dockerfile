FROM node:20-slim
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update && apt-get install -y tzdata openssl && rm -rf /var/lib/apt/lists/*
ENV TZ=Asia/Jakarta

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY dist ./dist
COPY prisma ./prisma
COPY public ./public

EXPOSE 5050
CMD ["sh", "-c", "npx prisma generate && (npx prisma migrate deploy || npx prisma db push) && (node prisma/seed.js || echo 'no compiled seed found') && node dist/server.js"]
