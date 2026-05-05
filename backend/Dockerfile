FROM php:8.2-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    unzip \
    curl \
    && docker-php-ext-install pdo pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy composer files first (layer caching)
COPY composer.json composer.lock* ./

# Install PHP dependencies (no dev, optimized)
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copy rest of backend
COPY . .

# Create logs directory
RUN mkdir -p logs && chmod 775 logs

# Expose port (Render sets $PORT dynamically)
EXPOSE 8000

# Start PHP built-in server on dynamic port
CMD php -S 0.0.0.0:${PORT:-8000} index.php
