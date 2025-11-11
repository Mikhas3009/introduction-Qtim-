FROM node:22

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production

# Приложение слушает APP_LISTEN_PORT=3000 из .env.docker
EXPOSE 3000

CMD ["node", "dist/server.js"]
