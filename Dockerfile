# Use the official Node.js runtime as the base image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml (if available)
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Set default environment variables for build
ENV NODE_ENV=production
ENV JWT_SECRET=default-jwt-secret-please-change-in-production

# Build the Next.js application
RUN pnpm build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]