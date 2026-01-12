FROM node:22-bullseye AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the production-ready files
RUN npm run build


FROM nginx:stable-alpine

# Copy build output to Nginx's public directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 3000 for the app
EXPOSE 3000

# Start Nginx 
CMD ["nginx", "-g", "daemon off;"]

