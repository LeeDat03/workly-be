# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY @types ./@types
RUN npm ci
COPY src ./src
RUN npm run build

# Production stage
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
RUN mkdir -p /app/public/uploads
EXPOSE 8004
CMD ["node", "dist/index.js"]