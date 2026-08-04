# Use a lightweight Node image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy the runner script and its package.json (if any)
COPY setup_runner.js ./
# If you have a package.json with dependencies, also copy it and run npm ci
# COPY package*.json ./
# RUN npm ci --only=production

# Expose the port the runner listens on (default 3098)
EXPOSE 3098

# Run the script
CMD ["node", "setup_runner.js"]
