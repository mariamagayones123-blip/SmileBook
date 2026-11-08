#!/bin/sh
# Runs every time the container starts on Render.

# Create/update the database tables (safe to repeat: it only runs migrations that are missing).
php artisan migrate --force || echo "WARNING: migrate failed, check the DB_* settings"

# First start only: create the admin account, dentists and services from ADMIN_EMAIL / ADMIN_PASSWORD.
# If the database already has data, the seeder skips itself. A failure here does not stop the server.
php artisan db:seed --force || echo "WARNING: seeding failed (is ADMIN_EMAIL / ADMIN_PASSWORD set?)"

exec apache2-foreground
