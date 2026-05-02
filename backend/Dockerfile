FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p /app/data

EXPOSE 4000

CMD ["node", "server.js"]
