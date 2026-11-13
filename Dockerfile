FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY database/package.json database/package.json
COPY client/package.json client/package.json
RUN npm ci
COPY client/ client/
RUN npm run build:client

FROM build AS production-deps
RUN npm prune --omit=dev

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=production-deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY database/package.json database/package.json
COPY client/package.json client/package.json
COPY server/src/ server/src/
COPY database/ database/
COPY --from=build /app/client/dist/ client/dist/
USER node
EXPOSE 3000
CMD ["node", "server/src/server.js"]
