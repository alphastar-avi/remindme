#!/bin/bash

# Build and Deploy Script for RemindMe App
set -e

echo "🚀 Starting deployment process for RemindMe app..."

# Check if required tools are installed
command -v az >/dev/null 2>&1 || { echo "❌ Azure CLI is required but not installed. Aborting." >&2; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo "❌ Terraform is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }

# Variables
RESOURCE_GROUP=""
ACR_NAME=""
BACKEND_IMAGE_TAG="latest"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --resource-group)
      RESOURCE_GROUP="$2"
      shift 2
      ;;
    --acr-name)
      ACR_NAME="$2"
      shift 2
      ;;
    --tag)
      BACKEND_IMAGE_TAG="$2"
      shift 2
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Check if terraform.tfvars exists
if [ ! -f "../terraform/terraform.tfvars" ]; then
    echo "❌ terraform.tfvars not found. Please create it from terraform.tfvars.example"
    exit 1
fi

# Step 1: Deploy infrastructure with Terraform
echo "🏗️  Deploying infrastructure with Terraform..."
cd ../terraform
terraform init
terraform plan
terraform apply -auto-approve

# Get outputs from Terraform
ACR_LOGIN_SERVER=$(terraform output -raw container_registry_login_server)
ACR_USERNAME=$(terraform output -raw container_registry_admin_username)
RESOURCE_GROUP=$(terraform output -raw resource_group_name)

echo "✅ Infrastructure deployed successfully"

# Step 2: Build and push backend Docker image
echo "🔨 Building and pushing backend image..."
cd ../backend

# Login to ACR
az acr login --name $ACR_NAME

# Build and push backend image
docker build -t $ACR_LOGIN_SERVER/reminder-backend:$BACKEND_IMAGE_TAG .
docker push $ACR_LOGIN_SERVER/reminder-backend:$BACKEND_IMAGE_TAG

echo "✅ Backend image pushed successfully"

# Step 3: Update Container App
echo "🔄 Updating Container App..."
az containerapp update \
    --name reminder-app-backend \
    --resource-group $RESOURCE_GROUP \
    --image $ACR_LOGIN_SERVER/reminder-backend:$BACKEND_IMAGE_TAG

echo "✅ Container App updated successfully"

# Step 4: Build and deploy frontend
echo "🎨 Building and deploying frontend..."
cd ../frontend

# Build the React app
npm run build

echo "✅ Frontend built successfully"

# Get Static Web App deployment token
SWA_TOKEN=$(cd ../terraform && terraform output -raw static_web_app_api_key)

# Deploy to Static Web App using Azure CLI
az staticwebapp deploy \
    --name reminder-app-frontend \
    --resource-group $RESOURCE_GROUP \
    --source ./build \
    --token $SWA_TOKEN

echo "✅ Frontend deployed successfully"

# Step 5: Display URLs
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📱 Frontend URL: $(cd ../terraform && terraform output -raw frontend_url)"
echo "🔧 Backend URL: $(cd ../terraform && terraform output -raw backend_url)"
echo ""
echo "🔐 Database Details:"
echo "   Server: $(cd ../terraform && terraform output -raw postgres_server_fqdn)"
echo "   Database: reminder_app"
echo ""
echo "🎊 Your RemindMe app is now live on Azure!"
