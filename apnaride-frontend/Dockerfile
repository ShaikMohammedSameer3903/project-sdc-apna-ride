# Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build with API and WS base paths pointing to nginx proxy locations
ARG VITE_API_BASE=/api
ARG VITE_WS_BASE=/ws
ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_WS_BASE=${VITE_WS_BASE}
RUN echo "Building with VITE_API_BASE=$VITE_API_BASE VITE_WS_BASE=$VITE_WS_BASE" && npm run build

# Runtime stage with Nginx
FROM nginx:1.25-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Healthcheck deps
RUN apk add --no-cache curl

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:80 || exit 1

CMD ["nginx","-g","daemon off;"]
