FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY prisma ./prisma
COPY src ./src
COPY public ./public

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]