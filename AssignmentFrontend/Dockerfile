FROM node:20-alpine
# Set the working directory inside the container
WORKDIR /app

# 1. Copy and install dependencies
COPY package*.json ./
RUN npm install

# 2. Copy the necessary configuration files from your local project root
#    (The ones next to the Dockerfile: package.json, tsconfig.json, etc.)
COPY tsconfig.json ./
COPY vite.config.ts ./
# Add any other config files needed for the build (e.g., remix.config.js, .env.development)

# 3. Copy the 'app' directory contents to the WORKDIR /app
#    This makes the path to your file /app/root.tsx, fixing the error.
COPY app ./app

# 4. Build the application
RUN npm run build 
ENV VITE_API_URL=http://assignment-api:8900

EXPOSE 3000
CMD [ "npm", "start" ]