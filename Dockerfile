# Dockerfile (should be in your Node.js repo root)
FROM node:16-alpine

WORKDIR /usr/src/app

# Copy package files first for better caching
COPY package*.json ./

RUN npm install

# Copy all files
COPY . .

# Build the app (if needed)
#RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
