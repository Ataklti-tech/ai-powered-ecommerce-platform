# #  Development 
FROM node:22-alpine AS dev

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]

# Production
FROM node:22-alpine AS prod

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production
COPY . .

EXPOSE 5000

CMD ["npm", "run", "start"]