#!/bin/bash
# Disaster Recovery Script: Infrastructure Rebuild
# This script attempts to bring up the entire test environment stack (Postgres, PostgREST).

set -e

echo "Starting infrastructure rebuild process..."

# 1. Stop any existing test containers/services (if applicable)
echo "Stopping existing services..."
docker-compose down || echo "Services might not be running, continuing..."

# 2. Pull latest images to ensure compatibility
echo "Pulling latest necessary images..."
docker-compose pull

# 3. Bring up the services defined in docker-compose.yaml
echo "Bringing up all services (Postgres, PostgREST, Nginx proxies)..."
docker-compose up -d --build

echo "Infrastructure rebuild complete. Check logs for errors."