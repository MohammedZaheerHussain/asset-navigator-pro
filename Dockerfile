FROM php:8.2-cli

# Install PostgreSQL PDO extension and tools
RUN apt-get update && apt-get install -y \
    libpq-dev \
    unzip \
    curl \
    && docker-php-ext-install pdo pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory to backend
WORKDIR /app

# Copy backend files
COPY backend/composer.json backend/composer.lock* ./

# Install PHP dependencies (production, optimised)
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copy rest of backend source
COPY backend/ .

# Create logs directory
RUN mkdir -p logs && chmod 775 logs

# Render sets PORT dynamically (default 8000)
EXPOSE 8000

# Start PHP built-in server
CMD php -S 0.0.0.0:${PORT:-8000} index.php
