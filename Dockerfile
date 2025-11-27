# Build Stage 1
FROM node:22-alpine AS build
WORKDIR /app

# Copy only package.json and package-lock.json first (for caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --omit=dev=false

# Copy the entire project
COPY . ./

# Build the project
RUN npm run build

# Build Stage 2
FROM node:22-alpine
WORKDIR /app

# Copy the built output only
COPY --from=build /app/.output/ ./

# Change the port and host
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["node", "/app/server/index.mjs"]
