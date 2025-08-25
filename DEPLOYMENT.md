# Azure Deployment Guide

## Prerequisites

1. **Azure CLI** installed and logged in
2. **Terraform** installed (v1.5.0+)
3. **GitHub repository** with this code

## Setup Steps

### 1. Create Azure Service Principal

```bash
az ad sp create-for-rbac --name "reminder-app-sp" --role contributor \
  --scopes /subscriptions/{subscription-id} --sdk-auth
```

### 2. Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

```
AZURE_CREDENTIALS: {output from step 1}
POSTGRES_PASSWORD: YourSecurePassword123!
JWT_SECRET: your-production-jwt-secret-key-change-me
```

### 3. Update Terraform Variables

Copy and customize the terraform variables:
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with unique names:
- `acr_name`: Must be globally unique (e.g., "reminderappacr2024")
- `postgres_server_name`: Must be globally unique (e.g., "reminder-postgres-2024")

### 4. Deploy Infrastructure

#### Option A: Via GitHub Actions (Recommended)
Push to main branch - GitHub Actions will handle everything automatically.

#### Option B: Manual Deployment
```bash
# Deploy infrastructure
cd terraform
terraform init
terraform plan
terraform apply

# Build and push backend
cd ../backend
az acr build --registry {your-acr-name} --image reminder-backend:latest .

# Update container app
az containerapp update \
  --name reminder-app-backend \
  --resource-group reminder-app-rg \
  --image {your-acr-name}.azurecr.io/reminder-backend:latest

# Build and deploy frontend
cd ../frontend
npm run build
az staticwebapp deploy \
  --name reminder-app-frontend \
  --resource-group reminder-app-rg \
  --source ./build \
  --token {static-web-app-token}
```

## Architecture

- **Frontend**: React app → Azure Static Web Apps
- **Backend**: Go API → Azure Container Apps  
- **Database**: PostgreSQL → Azure Database for PostgreSQL Flexible Server
- **Registry**: Docker images → Azure Container Registry
- **Networking**: Private networking for database security

## URLs After Deployment

- Frontend: `https://{static-web-app-name}.azurestaticapps.net`
- Backend API: `https://{container-app-name}.{region}.azurecontainerapps.io`

## Local Development

Keep using Docker Compose for local development:
```bash
docker-compose up -d
```

This runs all services locally (postgres + backend + frontend) for testing before deployment.
