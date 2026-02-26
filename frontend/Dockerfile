#  Development 
FROM node:22-alpine AS dev

# Define working directory in container
WORKDIR /app

# Copy package.json and package-lock.json to container
COPY package*.json ./

RUN npm install
COPY . .

EXPOSE 5173

# start app in dev (development server)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
# RUN npm run dev

# ///////////////////////


#  Build stage
FROM node:22-alpine AS build

# Define working directory in container
WORKDIR /app

# Copy package.json and package-lock.json to container
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production
COPY . .

# start app in dev
RUN npm run build

# Production
FROM nginx:alpine 

# Copy build files to Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]