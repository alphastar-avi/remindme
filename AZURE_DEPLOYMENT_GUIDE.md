# Complete Azure Deployment Guide - Full-Stack Applications

## Overview
This comprehensive guide covers the complete deployment of any full-stack web application to Azure, including:
- **Backend**: Any containerized backend (Go, Node.js, Python, .NET, etc.) in Azure Container Apps
- **Frontend**: React, Vue, Angular, or any static frontend in Azure Static Web Apps  
- **Database**: PostgreSQL Flexible Server (adaptable to other databases)

## Prerequisites
- Azure CLI installed and logged in
- Docker Desktop installed
- Node.js and npm installed
- Git repository (optional)

---

## Phase 1: Database Setup (PostgreSQL Flexible Server)

### Step 1.1: Create Resource Group
```bash
# Replace with your preferred resource group name and location
az group create --name MyAppResourceGroup --location "Central India"
```

**Parameters Explained:**
- `--name`: Your resource group name (choose descriptive name)
- `--location`: Azure region (use `az account list-locations` to see all options)

### Step 1.2: Create PostgreSQL Flexible Server
```bash
az postgres flexible-server create \
  --resource-group MyAppResourceGroup \
  --name myapp-database \
  --location "Central India" \
  --admin-user dbadmin \
  --admin-password 'YourSecurePassword123!' \
  --sku-name Standard_B1ms \
  --storage-size 32 \
  --version 16
```

**Parameters Explained:**
- `--name`: Database server name (must be globally unique)
- `--admin-user`: Database administrator username
- `--admin-password`: Strong password (use single quotes for special characters)
- `--sku-name`: Performance tier (B1ms = 1 vCore, 2GB RAM, good for small apps)
- `--storage-size`: Storage in GB (32GB minimum)
- `--version`: PostgreSQL version (16 is latest stable)

**Important Notes:**
- Password must be enclosed in single quotes to handle special characters
- SSL is enabled by default (required for Azure)
- Firewall rules may need to be configured

### Step 1.3: Configure Firewall (if needed)
```bash
# Allow all IPs (for testing only - NOT recommended for production)
az postgres flexible-server firewall-rule create \
  --resource-group MyAppResourceGroup \
  --name myapp-database \
  --rule-name AllowAll \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 255.255.255.255

# For production, allow specific IPs only:
# az postgres flexible-server firewall-rule create \
#   --resource-group MyAppResourceGroup \
#   --name myapp-database \
#   --rule-name AllowMyIP \
#   --start-ip-address YOUR_IP_ADDRESS \
#   --end-ip-address YOUR_IP_ADDRESS
```

**Security Note:** The AllowAll rule is for testing only. In production, restrict access to specific IP ranges.

### Step 1.4: Get Database Connection Details
```bash
az postgres flexible-server show \
  --resource-group MyAppResourceGroup \
  --name myapp-database \
  --query "{host:fullyQualifiedDomainName,user:administratorLogin}"
```

**Expected Output:**
```json
{
  "host": "myapp-database.postgres.database.azure.com",
  "user": "dbadmin"
}
```

**Save these values** - you'll need them for backend environment variables.

---

## Phase 2: Backend Preparation & Dockerization

### Step 2.1: Prepare Backend for Azure Database Connection

**For any backend framework, ensure these configurations:**

#### A. Database SSL Configuration
Azure PostgreSQL requires SSL connections. Configure your backend accordingly:

**Go Example:**
```go
// Ensure SSL support is enabled
sslmode := getEnv("DB_SSLMODE", "require")
dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=UTC",
    host, user, password, dbname, port, sslmode)
```

**Node.js Example:**
```javascript
const config = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false } // Required for Azure PostgreSQL
};
```

**Python Example:**
```python
import os
DATABASE_URL = f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}?sslmode=require"
```

### Step 2.2: Configure CORS for Static Web Apps

**Critical**: Your backend must allow requests from your Static Web App domain.

**Go/Gin Example:**
```go
r.Use(cors.New(cors.Config{
    AllowOrigins: []string{
        "http://localhost:3000",                              // Local development
        "https://your-app-name.azurestaticapps.net",         // Your Static Web App
        "https://*.azurestaticapps.net",                     // Wildcard for preview deployments
        "https://*.azurewebsites.net"                        // Azure Web Apps
    },
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
    ExposeHeaders:    []string{"Content-Length"},
    AllowCredentials: true,
}))
```

**Express.js Example:**
```javascript
const cors = require('cors');
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-app-name.azurestaticapps.net',
    /https:\/\/.*\.azurestaticapps\.net$/
  ],
  credentials: true
}));
```

**Important**: You'll need to update this with your actual Static Web App URL after deployment.

### Step 2.3: Create Dockerfile for Your Backend

**Generic Dockerfile Template:**
```dockerfile
# Multi-stage build for any language
FROM node:18-alpine AS builder  # Replace with your language base image
WORKDIR /app
COPY package*.json ./           # Replace with your dependency files
RUN npm install                 # Replace with your install command
COPY . .
RUN npm run build              # Replace with your build command

# Production stage
FROM node:18-alpine            # Replace with your runtime image
WORKDIR /app
COPY --from=builder /app/dist ./dist  # Adjust paths as needed
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 8080                    # Replace with your app's port
CMD ["npm", "start"]           # Replace with your start command
```

### Step 2.4: Build Docker Image for Azure (x86)
```bash
cd backend

# Build for Azure (x86_64) - Critical for ARM Macs
docker build --platform linux/amd64 -t your-app-backend .
```

**Why `--platform linux/amd64`?**
- Azure Container Apps run on x86_64 architecture
- ARM Macs need cross-compilation to target x86
- Without this flag, ARM images won't run on Azure servers
- Intel/AMD machines can omit this flag

---

## Phase 3: Azure Container Registry (ACR)

### Step 3.1: Create Container Registry
```bash
az acr create \
  --resource-group MyAppResourceGroup \
  --name myappregistry \
  --sku Basic
```

**Parameters Explained:**
- `--name`: Registry name (must be globally unique, alphanumeric only)
- `--sku`: Pricing tier (Basic = $5/month, Standard = $20/month, Premium = $50/month)

**Registry Naming Rules:**
- 5-50 characters
- Alphanumeric only (no hyphens or underscores)
- Must be globally unique across all Azure

### Step 3.2: Enable Admin User
```bash
az acr update --name myappregistry --admin-enabled true
```

**Why Enable Admin User?**
- Simplifies authentication for Container Apps
- Alternative: Use service principal or managed identity (more secure for production)

### Step 3.3: Login to ACR
```bash
az acr login --name myappregistry
```

**This command:**
- Authenticates Docker with your ACR
- Configures Docker to push/pull from your registry
- Valid for current session only

### Step 3.4: Get ACR Credentials
```bash
az acr credential show --name myappregistry
```

**Expected Output:**
```json
{
  "passwords": [
    {
      "name": "password",
      "value": "your-registry-password-here"
    },
    {
      "name": "password2", 
      "value": "your-backup-password-here"
    }
  ],
  "username": "myappregistry"
}
```

**Save these credentials** - you'll need them for Container Apps deployment.

### Step 3.5: Tag and Push Image
```bash
# Tag your image for ACR (replace with your image name)
docker tag your-app-backend myappregistry.azurecr.io/your-app-backend:latest

# Push to ACR
docker push myappregistry.azurecr.io/your-app-backend:latest
```

**Tag Format Explained:**
- `myappregistry.azurecr.io` = Your ACR login server
- `your-app-backend` = Your image name
- `latest` = Tag (use version numbers for production)

---

## Phase 4: Azure Container Apps

### Step 4.1: Create Container App Environment
```bash
az containerapp env create \
  --name myapp-env \
  --resource-group MyAppResourceGroup \
  --location eastus
```

**Parameters Explained:**
- `--name`: Environment name (shared by multiple container apps)
- `--location`: Azure region (choose based on your users' location)

**Popular Regions:**
- `eastus` - East US (Virginia)
- `westus2` - West US 2 (Washington)
- `westeurope` - West Europe (Netherlands)
- `southeastasia` - Southeast Asia (Singapore)

### Step 4.2: Create Container App
```bash
az containerapp create \
  --name myapp-backend \
  --resource-group MyAppResourceGroup \
  --environment myapp-env \
  --image myappregistry.azurecr.io/your-app-backend:latest \
  --target-port 8080 \
  --ingress external \
  --registry-server myappregistry.azurecr.io \
  --registry-username myappregistry \
  --registry-password "your-acr-password-here" \
  --env-vars \
    DB_HOST=myapp-database.postgres.database.azure.com \
    DB_USER=dbadmin \
    DB_PASSWORD='YourStrongPassword123!' \
    DB_NAME=postgres \
    DB_SSLMODE=require \
    PORT=8080
```

**Critical Configuration Notes:**
- Replace `your-acr-password-here` with actual ACR password from Step 3.4
- Use single quotes around passwords containing special characters
- `--target-port` must match your app's listening port
- `--ingress external` makes your app publicly accessible
- Add any additional environment variables your app needs

**Common Environment Variables by Framework:**
- **Node.js**: `NODE_ENV=production`
- **Python**: `PYTHONPATH=/app`
- **Go**: Usually none needed beyond database config
- **Java**: `JAVA_OPTS=-Xmx512m`

### Step 4.3: Verify Deployment
```bash
# Check container app status
az containerapp show \
  --name myapp-backend \
  --resource-group MyAppResourceGroup \
  --query "properties.{status:runningStatus,fqdn:configuration.ingress.fqdn}"
```

**Expected Output:**
```json
{
  "fqdn": "myapp-backend.kindwater-12345678.eastus.azurecontainerapps.io",
  "status": "Running"
}
```

**Test Your Backend:**
```bash
# Test health endpoint (replace with your actual URL)
curl https://myapp-backend.kindwater-12345678.eastus.azurecontainerapps.io/health
```

**Expected Response:**
```json
{"status":"healthy"}
```

**Save your backend URL** - you'll need it for frontend configuration.

---

## Phase 5: Frontend Preparation

### Step 5.1: Configure Frontend API URL

**For React Apps:**
Create `frontend/.env.production`:
```bash
REACT_APP_API_URL=https://your-backend-url.azurecontainerapps.io/api
```

**For Vue.js Apps:**
Create `frontend/.env.production`:
```bash
VUE_APP_API_URL=https://your-backend-url.azurecontainerapps.io/api
```

**For Angular Apps:**
Update `frontend/src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-url.azurecontainerapps.io/api'
};
```

**Replace `your-backend-url` with your actual Container App URL from Step 4.3**

### Step 5.2: Build Frontend for Production
```bash
cd frontend

# Install dependencies
npm install

# Build for production
npm run build
```

**Framework-Specific Build Commands:**
- **React**: `npm run build` (creates `build/` folder)
- **Vue.js**: `npm run build` (creates `dist/` folder)
- **Angular**: `ng build --prod` (creates `dist/` folder)
- **Next.js**: `npm run build && npm run export` (creates `out/` folder)

**Verify**: Check that the build folder contains optimized files (HTML, CSS, JS)

---

## Phase 6: Azure Static Web Apps

### Step 6.1: Create Static Web App
```bash
az staticwebapp create \
  --name myapp-frontend \
  --resource-group MyAppResourceGroup \
  --location "East US 2" \
  --sku Free
```

**Available Regions for Static Web Apps:**
- `East US 2` (Virginia)
- `Central US` (Iowa)
- `West US 2` (Washington)
- `West Europe` (Netherlands)
- `East Asia` (Hong Kong)

**SKU Options:**
- `Free`: 100GB bandwidth/month, custom domains, SSL
- `Standard`: 500GB bandwidth/month, staging environments, APIs

### Step 6.2: Get Deployment Token
```bash
az staticwebapp secrets list \
  --name myapp-frontend \
  --resource-group MyAppResourceGroup \
  --query "properties.apiKey" -o tsv
```

**Save this token** - you'll need it for deployment.

### Step 6.3: Install Azure Static Web Apps CLI
```bash
npm install -g @azure/static-web-apps-cli
```

### Step 6.4: Deploy Frontend
```bash
cd frontend

# Deploy using Static Web Apps CLI
swa deploy ./build --deployment-token 'YOUR_DEPLOYMENT_TOKEN_HERE'
```

**Framework-Specific Deploy Commands:**
- **React**: `swa deploy ./build --deployment-token 'TOKEN'`
- **Vue.js**: `swa deploy ./dist --deployment-token 'TOKEN'`
- **Angular**: `swa deploy ./dist/your-app-name --deployment-token 'TOKEN'`
- **Next.js**: `swa deploy ./out --deployment-token 'TOKEN'`

**Replace `YOUR_DEPLOYMENT_TOKEN_HERE` with your actual token from Step 6.2**

### Step 6.5: Get Static Web App URL
```bash
az staticwebapp show \
  --name myapp-frontend \
  --resource-group MyAppResourceGroup \
  --query "defaultHostname" -o tsv
```

**Expected Output:**
```
myapp-frontend.1.azurestaticapps.net
```

**Your frontend URL will be:** `https://myapp-frontend.1.azurestaticapps.net`

### Step 6.6: Update Backend CORS Configuration

**Critical Step**: Add your Static Web App URL to backend CORS configuration.

1. **Update your backend CORS code** with the actual Static Web App URL:
```go
// Example for Go/Gin
AllowOrigins: []string{
    "http://localhost:3000",
    "https://myapp-frontend.1.azurestaticapps.net",  // Add this line
    "https://*.azurestaticapps.net",
}
```

2. **Rebuild and redeploy backend:**
```bash
# Rebuild backend with updated CORS
docker build --platform linux/amd64 -t your-app-backend .
docker tag your-app-backend myappregistry.azurecr.io/your-app-backend:latest
docker push myappregistry.azurecr.io/your-app-backend:latest

# Update container app with new image
az containerapp update \
  --name myapp-backend \
  --resource-group MyAppResourceGroup \
  --image myappregistry.azurecr.io/your-app-backend:latest
```

### Step 7.3: Verify CORS Fix 
```bash
curl -X OPTIONS \
  -H "Origin: https://your-static-app-domain.azurestaticapps.net" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://your-backend-url.azurecontainerapps.io/api/auth/login -v
```

**Expected**: HTTP 204 response with CORS headers

---

## Phase 7: Testing & Verification

### Step 7.1: Test Backend Health
```bash
curl https://your-backend-url.azurecontainerapps.io/health
```

**Expected Response:**
```json
{"status":"healthy"}
```

### Step 7.2: Test Frontend Loading
Visit your Static Web App URL in a browser and check:
- Page loads without errors
- No console errors in browser developer tools
- API calls work (check Network tab)

### Step 7.3: Verify CORS Configuration
```bash
curl -X OPTIONS \
  -H "Origin: https://your-static-app-domain.azurestaticapps.net" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://your-backend-url.azurecontainerapps.io/api/auth/login -v
```

**Expected**: HTTP 204 response with CORS headers

---

## Common Issues & Solutions

### Issue 1: CORS 403 Errors
**Symptom**: Frontend shows "Preflight response is not successful. Status code: 403"

**Solution**: 
1. Add exact Static Web App domain to CORS AllowOrigins
2. Rebuild and redeploy backend
3. Wildcard patterns (`*.azurestaticapps.net`) may not work reliably

### Issue 2: Database Connection Failures
**Symptom**: "failed to connect to database" in container logs

**Solution**:
1. Verify environment variables are set correctly
2. Ensure `DB_SSLMODE=require` is set
3. Check firewall rules on PostgreSQL server
4. Test connection string locally first

### Issue 3: ARM vs x86 Architecture
**Symptom**: Container fails to start on Azure

**Solution**: Always use `--platform linux/amd64` when building on ARM Macs

### Issue 4: Environment Variable Syntax
**Symptom**: Special characters in passwords cause issues

**Solution**: Use single quotes around values with special characters in CLI commands

### Issue 5: Static Web App Region Limitations
**Symptom**: "location not available" error

**Solution**: Use available regions like East US 2, West US 2, East Asia, etc.

### Issue 6: Container App Won't Start
**Symptom**: Container app shows "Failed" status

**Solutions**:
1. Check container logs: `az containerapp logs show --name myapp-backend --resource-group MyAppResourceGroup`
2. Verify image exists in ACR
3. Check environment variables are set correctly
4. Ensure target port matches your app's listening port

---

## Final Verification Checklist

- [ ] Database accessible and migrations run successfully
- [ ] Backend health endpoint returns `{"status":"healthy"}`
- [ ] Frontend loads without console errors
- [ ] User registration/authentication works
- [ ] API calls succeed (no CORS errors)
- [ ] All application features work end-to-end

---

## Environment Variables Template

### Backend Container App Environment Variables:
```bash
DB_HOST=your-database.postgres.database.azure.com
DB_USER=your-db-admin-user
DB_PASSWORD='YourStrongPassword123!'
DB_NAME=postgres
DB_SSLMODE=require
PORT=8080
```

### Frontend Environment Variables:
```bash
# React
REACT_APP_API_URL=https://your-backend.azurecontainerapps.io/api

# Vue.js
VUE_APP_API_URL=https://your-backend.azurecontainerapps.io/api

# Angular (in environment.prod.ts)
apiUrl: 'https://your-backend.azurecontainerapps.io/api'
```

---

## Resource URLs Template

Replace these with your actual resource names:

- **Frontend**: https://your-app-frontend.1.azurestaticapps.net
- **Backend**: https://your-app-backend.kindwater-12345678.eastus.azurecontainerapps.io
- **Database**: your-app-database.postgres.database.azure.com
- **Container Registry**: your-app-registry.azurecr.io

---

## Cost Considerations

- **PostgreSQL Flexible Server**: ~$15-30/month (Standard_B1ms)
- **Container Apps**: Pay-per-use (very low for small apps)
- **Static Web Apps**: Free tier available
- **Container Registry**: ~$5/month (Basic tier)

**Total Estimated Cost**: $20-40/month for a small production app

---

## Security Best Practices

1. **Never hardcode credentials** in source code
2. **Use environment variables** for all sensitive data
3. **Enable SSL/TLS** for all connections
4. **Restrict database firewall** to specific IPs in production
5. **Use Azure Key Vault** for production secrets
6. **Enable monitoring** and logging for all services

---

## Monitoring & Debugging

### View Container App Logs:
```bash
az containerapp logs show \
  --name reminder-backend \
  --resource-group ReminderApp \
  --follow
```

### View Container App Metrics:
```bash
az containerapp show \
  --name reminder-backend \
  --resource-group ReminderApp \
  --query "properties.{status:runningStatus,replicas:template.scale}"
```

### Database Connection Test:
```bash
# From local machine (if firewall allows)
psql "host=myreminderdb.postgres.database.azure.com port=5432 dbname=postgres user=myadmin password=MyStrongPassword123! sslmode=require"
```

---

This guide provides a complete, step-by-step process for deploying a full-stack application to Azure with all the gotchas and solutions encountered during the actual deployment process.
