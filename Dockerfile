FROM node:20-alpine

# v3
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
COPY public ./public

EXPOSE 8080

CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]