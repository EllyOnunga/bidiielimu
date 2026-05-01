# Stage 1: Build
FROM node:22-slim as build-stage

WORKDIR /app

# NETWORK HARDENING for unstable connections:
# Increase timeouts, retries, and use HTTP to bypass SSL resets
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retry-maxtimeout 1200000 && \
    npm config set fetch-retry-mintimeout 30000 && \
    npm config set fetch-retries 20 && \
    npm config set maxsockets 2 && \
    npm config set progress false

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:stable-alpine as production-stage

# Copy build files from Stage 1
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Add custom nginx config to handle SPA routing
RUN printf "server { \n\
    listen 80; \n\
    location / { \n\
        root /usr/share/nginx/html; \n\
        index index.html index.htm; \n\
        try_files \$uri \$uri/ /index.html; \n\
    } \n\
    location /api/ { \n\
        proxy_pass http://backend:8000/api/; \n\
        proxy_set_header Host \$host; \n\
        proxy_set_header X-Real-IP \$remote_addr; \n\
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; \n\
        proxy_set_header X-Forwarded-Proto \$scheme; \n\
    } \n\
    }" > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
