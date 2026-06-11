# ----- Etapa 1: construir el bundle -----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_URL se inyecta en tiempo de build (Vite lo embebe en el bundle)
# ARG VITE_API_URL=http://localhost:4000/api
ARG VITE_API_URL=https://agrosmart-backend-15511153710.us-central1.run.app/api
ARG VITE_RECAPTCHA_SITE_KEY=6Lf3sBUtAAAAAC3vI4IvbYsDqxlpYy2DxHOyTJ_I
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_RECAPTCHA_SITE_KEY=$VITE_RECAPTCHA_SITE_KEY

RUN npm run build

# ----- Etapa 2: servir con nginx -----
FROM nginx:1.27-alpine AS runner

# Configuracion personalizada (la creamos en el siguiente paso)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos solo el resultado del build (dist/), nada mas
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]