#!/bin/bash

# Azure deployment script for RemindMe app
set -e

echo "🚀 Starting Azure deployment for RemindMe app..."

# Variables
RESOURCE_GROUP="reminder-app-rg"
LOCATION="eastus"
ACR_NAME="reminderapp"
APP_NAME="reminder-app"
DB_SERVER_NAME="reminder-postgres"
DB_NAME="reminder_app"

# Login to Azure (if not already logged in)
echo "📝 Checking Azure login..."
az account show > /dev/null 2>&1 || az login

# Create resource group
echo "🏗️  Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Azure Container Registry
echo "📦 Creating Azure Container Registry..."
az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "loginServer" --output tsv)

# Build and push backend image
echo "🔨 Building and pushing backend image..."
cd backend
az acr build --registry $ACR_NAME --image reminder-backend:latest .
cd ..

# Build and push frontend image
echo "🔨 Building and pushing frontend image..."
cd frontend
az acr build --registry $ACR_NAME --image reminder-frontend:latest .
cd ..

# Create PostgreSQL server
echo "🗄️  Creating PostgreSQL server..."
az postgres server create \
    --resource-group $RESOURCE_GROUP \
    --name $DB_SERVER_NAME \
    --location $LOCATION \
    --admin-user postgres \
    --admin-password "SecurePassword123!" \
    --sku-name GP_Gen5_2 \
    --version 13

# Configure PostgreSQL firewall
echo "🔥 Configuring PostgreSQL firewall..."
az postgres server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --server $DB_SERVER_NAME \
    --name AllowAzureServices \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0

# Create database
echo "📊 Creating database..."
az postgres db create \
    --resource-group $RESOURCE_GROUP \
    --server-name $DB_SERVER_NAME \
    --name $DB_NAME

# Create Container App Environment
echo "🌐 Creating Container App Environment..."
az containerapp env create \
    --name "${APP_NAME}-env" \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query "username" --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv)

# Create backend container app
echo "🚀 Creating backend container app..."
az containerapp create \
    --name "${APP_NAME}-backend" \
    --resource-group $RESOURCE_GROUP \
    --environment "${APP_NAME}-env" \
    --image "${ACR_LOGIN_SERVER}/reminder-backend:latest" \
    --target-port 8080 \
    --ingress external \
    --registry-server $ACR_LOGIN_SERVER \
    --registry-username $ACR_USERNAME \
    --registry-password $ACR_PASSWORD \
    --env-vars \
        DB_HOST="${DB_SERVER_NAME}.postgres.database.azure.com" \
        DB_PORT=5432 \
        DB_USER=postgres \
        DB_PASSWORD="SecurePassword123!" \
        DB_NAME=$DB_NAME \
        JWT_SECRET="azure-production-jwt-secret-change-me" \
        PORT=8080

# Get backend URL
BACKEND_URL=$(az containerapp show --name "${APP_NAME}-backend" --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" --output tsv)

# Create frontend container app
echo "🎨 Creating frontend container app..."
az containerapp create \
    --name "${APP_NAME}-frontend" \
    --resource-group $RESOURCE_GROUP \
    --environment "${APP_NAME}-env" \
    --image "${ACR_LOGIN_SERVER}/reminder-frontend:latest" \
    --target-port 80 \
    --ingress external \
    --registry-server $ACR_LOGIN_SERVER \
    --registry-username $ACR_USERNAME \
    --registry-password $ACR_PASSWORD \
    --env-vars \
        REACT_APP_API_URL="https://${BACKEND_URL}/api"

# Get frontend URL
FRONTEND_URL=$(az containerapp show --name "${APP_NAME}-frontend" --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" --output tsv)

echo "✅ Deployment completed successfully!"
echo ""
echo "📱 Frontend URL: https://${FRONTEND_URL}"
echo "🔧 Backend URL: https://${BACKEND_URL}"
echo ""
echo "🔐 Database Details:"
echo "   Server: ${DB_SERVER_NAME}.postgres.database.azure.com"
echo "   Database: ${DB_NAME}"
echo "   Username: postgres"
echo ""
echo "🎉 Your RemindMe app is now live on Azure!"
