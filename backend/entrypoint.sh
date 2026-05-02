#!/bin/bash

# Wait for postgres
echo "Waiting for postgres..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 0.1
done
echo "PostgreSQL started"

# Run migrations
python manage.py migrate_schemas --shared --noinput
python manage.py migrate_schemas --tenant --noinput

# Collect static files
python manage.py collectstatic --noinput

# Start Daphne
exec daphne -b 0.0.0.0 -p 8000 config.asgi:application
