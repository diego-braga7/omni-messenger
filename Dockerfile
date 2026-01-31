# 1. Base stage - Apenas o necessário para o SO
FROM node:20-alpine AS base
WORKDIR /app
# Instalação global do NestJS CLI para facilitar comandos em dev (opcional em prod, mas útil para scripts)
RUN npm i -g @nestjs/cli

# 2. Dependencies stage (Todas as deps para Build e Dev)
FROM base AS deps
COPY package*.json ./
RUN npm ci

# 3. Production Dependencies stage (Apenas deps de Produção)
FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --omit=dev

# 4. Build stage
FROM base AS builder
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=3072
RUN npm run build

# 5. Development stage
FROM deps AS development
ENV NODE_ENV=development
WORKDIR /app
# Em desenvolvimento, o código é montado via volume, mas copiamos aqui para garantir
# que a imagem funcione mesmo sem volumes (ex: debugging isolado)
COPY . .
# O comando padrão para dev com hot-reload
CMD ["npm", "run", "start:dev"]

# 6. Production stage (Runner)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copia apenas os artefatos necessários
COPY --from=builder /app/dist ./dist
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package*.json ./
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/ || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
# Comando otimizado para produção (execução direta do node)
CMD ["node", "dist/main"]
