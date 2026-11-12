FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm ci && npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY config ./config
COPY data/products.snapshot.json ./data/products.snapshot.json
RUN mkdir -p /app/data/outbox && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
