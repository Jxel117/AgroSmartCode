# ----- Etapa 1: dependencias -----
FROM node:20-alpine AS deps
WORKDIR /app

# Copiamos solo package.json y package-lock.json primero.
# Docker cachea esta capa: si no cambian, no reinstala deps en cada build.
COPY package*.json ./
RUN npm ci --omit=dev

# ----- Etapa 2: imagen final de produccion -----
FROM node:20-alpine AS runner
WORKDIR /app

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=4000

# Usuario sin privilegios (seguridad: no correr como root)
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# Copiamos las dependencias instaladas desde la etapa anterior
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs src ./src

USER nodejs

EXPOSE 4000

# Comando de arranque: primero corre migraciones, luego inicia servidor
CMD ["sh", "-c", "node src/db/migrate.js && node src/server.js"]