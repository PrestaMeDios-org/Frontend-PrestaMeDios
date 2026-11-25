# Imagen del frontend de PrestaMeDios (SPEC-11 §4.2, plan §4.2).
#
#   docker build -t prestamedios-web .
#   docker run -p 8080:80 -e API_UPSTREAM=host.docker.internal:8000 prestamedios-web
#
# VITE_API_URL vacío (por defecto): la app llama a /api/v1/… en el mismo origen y
# nginx reenvía /api a la API (D-02). La misma imagen sirve para cualquier dominio.

# --- build: compila la SPA ------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# --- final: nginx con los archivos estáticos ------------------------------
FROM nginx:1.27-alpine AS final

# Dirección de la API vista desde nginx (servicio de compose o host:puerto).
ENV API_UPSTREAM=api:8000

# La imagen oficial pasa /etc/nginx/templates/*.template por envsubst al arrancar,
# sólo con las variables definidas (no toca $uri, $host…).
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /src/dist /usr/share/nginx/html

EXPOSE 80
