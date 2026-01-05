#!/bin/bash

# Configuration
CONTAINER_NAME="omni-messenger-postgres"
DB_USER="postgres"
DB_NAME="omni_messenger"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Verifying database environment...${NC}"

# Check if container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo -e "${RED}Error: Container $CONTAINER_NAME is not running.${NC}"
    echo "Please run 'docker-compose up -d postgres' first."
    exit 1
fi

# Check for reset flag
if [ "$1" == "reset" ]; then
    echo -e "${YELLOW}Resetting database '$DB_NAME'...${NC}"
    # Terminate existing connections
    docker exec $CONTAINER_NAME psql -U $DB_USER -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" > /dev/null 2>&1
    
    docker exec $CONTAINER_NAME psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Database dropped successfully.${NC}"
    else
        echo -e "${RED}Failed to drop database.${NC}"
        exit 1
    fi
fi

# Check if database exists
echo -e "${YELLOW}Checking if database '$DB_NAME' exists...${NC}"
DB_EXISTS=$(docker exec $CONTAINER_NAME psql -U $DB_USER -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" == "1" ]; then
    echo -e "${GREEN}Database '$DB_NAME' already exists.${NC}"
else
    echo -e "${YELLOW}Database '$DB_NAME' does not exist. Creating...${NC}"
    docker exec $CONTAINER_NAME psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Database '$DB_NAME' created successfully.${NC}"
    else
        echo -e "${RED}Failed to create database.${NC}"
        exit 1
    fi
fi

# Run migrations
echo -e "${YELLOW}Running migrations...${NC}"
APP_CONTAINER="omni-messenger-app"
if docker ps | grep -q "$APP_CONTAINER"; then
    echo -e "${YELLOW}Running migrations inside app container...${NC}"
    # Use the compiled data-source.js which is available in the container
    docker exec $APP_CONTAINER npm run typeorm migration:run -- -d dist/config/data-source.js
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Migrations executed successfully.${NC}"
    else
        echo -e "${RED}Migration failed.${NC}"
        echo -e "${YELLOW}If the error is 'already exists', try running with 'reset' argument: ./scripts/init-dev-db.sh reset${NC}"
        exit 1
    fi
else
    # Option 2: Run locally if app container is down but node_modules exists
    if [ -d "node_modules" ]; then
        echo -e "${YELLOW}App container not found. Running migrations locally...${NC}"
        # Locally we might be using TS, so use ts-node via npx or similar
        npx typeorm-ts-node-commonjs migration:run -d src/config/data-source.ts
    else
        echo -e "${RED}App container not running and local node_modules not found. Cannot run migrations.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}Database initialization complete!${NC}"
