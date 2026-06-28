FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup -S mathhub && adduser -S mathhub -G mathhub
COPY --from=builder --chown=mathhub:mathhub /app/public ./public
COPY --from=builder --chown=mathhub:mathhub /app/.next/standalone ./
COPY --from=builder --chown=mathhub:mathhub /app/.next/static ./.next/static

USER mathhub
EXPOSE 3000
CMD ["node", "server.js"]
