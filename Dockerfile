# Stage 1: Build the React app
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG REACT_APP_GOOGLE_CLIENT_ID
ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID

RUN npm run build

# Stage 2: Lightweight Node.js server (needed for runtime passcode verification)
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/build ./build
COPY server.js .
COPY package*.json ./

RUN npm install --omit=dev

ENV DECK_PASSCODE=""

EXPOSE 80

CMD ["node", "server.js"]
