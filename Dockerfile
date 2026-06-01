FROM nginx:1.25-alpine

# Copiar el build de Angular
COPY dist/intaqalab /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \

  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

LABEL maintainer="Daniel Cabrera"
LABEL app="intaqalab-front"

CMD ["nginx", "-g", "daemon off;"]
