# Build stage - builds the production files
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage - serve the built files with nginx
FROM nginx:alpine
# Remove default nginx content (optional)
RUN rm -rf /usr/share/nginx/html/*

# Copy built site from builder
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
