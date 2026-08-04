FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./

# 🛠️ Tambahkan semua tools untuk build native modules seperti libpq
RUN apk add --no-cache python3 make g++ libpq-dev bash nano

# Install dependencies, lewati peer conflict React 19
RUN npm install --legacy-peer-deps

# Copy source code dan build
COPY . .
RUN npm run build:standalone

# -------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Only copy the dist folder from builder
COPY --from=builder /app/dist ./

EXPOSE 3000
CMD ["node", "server.js"]
