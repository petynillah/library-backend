# 1. Use the official lightweight Node.js image
FROM node:20-alpine

# 2. Set the working directory inside the container
WORKDIR /usr/src/app

# 3. Copy dependency files first (optimizes Docker build caching)
COPY package*.json ./

# 4. Install production dependencies only
RUN npm ci --only=production

# 5. Copy the rest of your backend source code
COPY . .

# 6. Expose the port your bookServer.js listens on (matching Nginx config)
EXPOSE 8080

# 7. Start the application
CMD ["node", "index.js"]
