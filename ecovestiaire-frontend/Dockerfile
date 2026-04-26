# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Build application
COPY . .
RUN npm run build

# Run stage
FROM nginx:alpine
# Copy built assets from Angular 19 location
COPY --from=build /app/dist/ecovestiaire-frontend/browser /usr/share/nginx/html
# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
