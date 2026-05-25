FROM php:8.3-apache

RUN apt-get update && apt-get install -y \
        libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && rm -rf /var/lib/apt/lists/* \
    && a2enmod rewrite

# Increase upload limits
RUN echo "upload_max_filesize = 50M\npost_max_size = 55M\nmemory_limit = 128M" \
    > /usr/local/etc/php/conf.d/uploads.ini

COPY apache.conf /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html

EXPOSE 80
