# Root Dockerfile for backend
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --production
COPY tsconfig.json ./
COPY . ./
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
EXPOSE 5000
CMD ["node", "dist/server.js"]