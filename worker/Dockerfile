FROM node:20-alpine

# Install Docker CLI so the worker can spin up execution containers on the host
RUN apk add --no-cache docker-cli

WORKDIR /app

# Copy the prisma schema from the web app to generate the Prisma client
COPY apps/web/prisma ./prisma/

WORKDIR /app/worker

# Copy worker package files
COPY worker/package*.json ./

# Install dependencies
RUN npm ci

# Generate prisma client using the copied schema
RUN npx prisma generate --schema=../prisma/schema.prisma

# Copy the rest of the worker code
COPY worker/src/ ./src/

# Command to run the worker
CMD ["npm", "run", "start"]
