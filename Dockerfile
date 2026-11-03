# Multi-stage Dockerfile for FlowCity Saúde

# Stage 1: Build Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# Stage 3: Production Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Copy backend dependencies and build
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY --from=backend-builder /app/backend/dist ./dist

# Copy frontend static build
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 3001

CMD ["node", "dist/server.js"]
