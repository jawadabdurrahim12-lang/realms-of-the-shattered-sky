FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run check && npm run build
FROM node:22-bookworm-slim
ENV NODE_ENV=production PORT=4173 DATA_DIR=/app/data
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && mkdir /app/data && chown node:node /app/data
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4173
VOLUME ["/app/data"]
CMD ["node", "dist/server.js"]
