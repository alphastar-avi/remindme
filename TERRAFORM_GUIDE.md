# Terraform Guide: Infrastructure as Code

## What is Terraform?

**Terraform** is HashiCorp's Infrastructure as Code (IaC) tool that lets you define cloud resources using declarative configuration files instead of clicking through Azure Portal or running manual CLI commands.

## Why Use Terraform?

### **1. Reproducibility**
```bash
# Manual way (error-prone)
az group create --name myapp-rg --location eastus
az acr create --name myregistry --resource-group myapp-rg --sku Basic
az postgres flexible-server create --name mydb --resource-group myapp-rg...
# 50+ more commands...

# Terraform way (reliable)
terraform apply
```

### **2. State Management**
- **Tracks what exists** vs. what should exist
- **Prevents conflicts** when multiple people deploy
- **Shows planned changes** before applying them
- **Handles dependencies** automatically

### **3. Version Control**
- Infrastructure changes tracked in Git
- Code reviews for infrastructure modifications
- Rollback capabilities
- Audit trail of all changes

### **4. Multi-Environment Support**
```hcl
# Same code, different environments
terraform workspace select staging
terraform apply  # Creates staging environment

terraform workspace select prod
terraform apply  # Creates production environment
```

---

## Terraform Basics

### **Core Concepts**

**📄 Configuration Files (.tf)**
- Define what resources you want
- Written in HCL (HashiCorp Configuration Language)
- Declarative: describe end state, not steps

**🗃️ State File**
- Tracks current infrastructure state
- Maps configuration to real resources
- Stored locally or remotely (Azure Storage)

**📋 Plan**
- Preview of changes before applying
- Shows what will be created/modified/destroyed
- No changes made until you approve

**⚡ Apply**
- Executes the planned changes
- Creates/updates/deletes resources
- Updates state file

### **Basic Workflow**
```bash
terraform init    # Initialize working directory
terraform plan    # Preview changes
terraform apply   # Execute changes
terraform destroy # Clean up resources
```

---

## Your Project's Terraform Setup

Your project already has excellent Terraform configuration! Here's what it includes:

### **File Structure**
```
terraform/
├── main.tf              # Resource definitions
├── variables.tf         # Input variables
├── outputs.tf          # Output values
├── terraform.tfvars    # Variable values (your config)
└── terraform.tfvars.example  # Template
```

### **Resources Defined**
1. **Resource Group** - Container for all resources
2. **Container Registry** - Stores Docker images
3. **PostgreSQL Flexible Server** - Database with private networking
4. **Virtual Network** - Secure networking
5. **Container App Environment** - Runtime for backend
6. **Container App** - Your backend service
7. **Static Web App** - Your frontend
8. **Log Analytics** - Monitoring and logs

### **Advanced Features**
- **Private networking** for PostgreSQL
- **Secrets management** for passwords
- **Auto-scaling** configuration
- **Environment tagging**
- **Dependency management**

---

## Terraform Commands for Your Project

### **Initial Setup**
```bash
cd terraform

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars

# Initialize Terraform
terraform init
```

### **Development Workflow**
```bash
# Preview changes
terraform plan

# Apply changes
terraform apply

# View current state
terraform show

# List resources
terraform state list

# Get outputs
terraform output
```

### **Multi-Environment Management**
```bash
# Create staging environment
terraform workspace new staging
terraform apply -var="environment=staging"

# Switch to production
terraform workspace select prod
terraform apply -var="environment=prod"

# List environments
terraform workspace list
```

### **Advanced Operations**
```bash
# Import existing resource
terraform import azurerm_resource_group.main /subscriptions/SUB_ID/resourceGroups/existing-rg

# Refresh state
terraform refresh

# Validate configuration
terraform validate

# Format code
terraform fmt

# Destroy specific resource
terraform destroy -target=azurerm_container_app.backend
```

---

## Terraform Best Practices

### **1. Use Variables**
```hcl
# Bad: Hardcoded values
resource "azurerm_resource_group" "main" {
  name     = "myapp-rg"
  location = "East US"
}

# Good: Variables
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
}
```

### **2. Use Remote State**
```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfstateaccount"
    container_name       = "tfstate"
    key                  = "myapp.terraform.tfstate"
  }
}
```

### **3. Use Modules**
```hcl
# Reusable database module
module "database" {
  source = "./modules/postgresql"
  
  name                = var.postgres_server_name
  resource_group_name = azurerm_resource_group.main.name
  admin_password      = var.postgres_admin_password
}
```

### **4. Tag Everything**
```hcl
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Owner       = var.owner_email
  }
}

resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
  tags     = local.common_tags
}
```

---

# CI/CD: Continuous Integration & Deployment

## What is CI/CD?

**CI/CD** automates your software delivery pipeline from code commit to production deployment.

### **Continuous Integration (CI)**
- **Automated testing** on every code change
- **Code quality checks** (linting, security scans)
- **Build verification** ensures code compiles
- **Fast feedback** to developers

### **Continuous Deployment (CD)**
- **Automated deployment** to staging/production
- **Infrastructure updates** via Terraform
- **Rollback capabilities** if issues arise
- **Zero-downtime deployments**

## Why CI/CD Matters

### **🚀 Speed & Reliability**
```
Manual Process:          CI/CD Process:
Code → Manual Test →     Code → Auto Test → Auto Deploy
Manual Build →           ✅ Consistent
Manual Deploy →          ✅ Fast
❌ Error-prone           ✅ Reliable
❌ Slow
```

### **🛡️ Quality Assurance**
- Every change tested automatically
- Security scans catch vulnerabilities
- Code quality maintained consistently
- Breaking changes caught early

### **👥 Team Collaboration**
- Same process for all developers
- Clear deployment status visibility
- Automated notifications
- Standardized environments

---

## Your Project's CI/CD Pipeline

I've created an advanced CI/CD setup with **3 workflow files**:

### **1. Advanced CI/CD Pipeline** (`ci-cd-advanced.yml`)

**🔍 Stage 1: Quality Checks**
- Frontend: ESLint, tests, build verification
- Backend: Go lint, tests, security scan
- Runs on every PR and push

**🏗️ Stage 2: Infrastructure**
- Terraform deployment with workspace management
- Separate staging/prod environments
- Secure secrets handling

**📦 Stage 3: Backend Deployment**
- Cloud-native Docker builds (no local Docker needed)
- Multi-tag strategy (SHA, latest, environment)
- Automatic container app updates

**🌐 Stage 4: Frontend Deployment**
- Dynamic API URL injection
- Static Web Apps deployment
- Environment-specific builds

**✅ Stage 5: Integration Tests**
- Health checks
- CORS verification
- End-to-end smoke tests

**📢 Stage 6: Notifications**
- Success/failure notifications
- Deployment URLs shared

### **2. Staging Environment** (`staging-environment.yml`)

**🔄 PR-Based Staging**
- Creates temporary environment for each PR
- Unique database per PR
- Comments PR with staging URL
- Auto-cleanup when PR closes

### **3. Security Scanning** (`security-scan.yml`)

**🛡️ Comprehensive Security**
- Weekly automated scans
- Frontend vulnerability checks
- Backend security analysis
- Container image scanning
- Terraform security validation

---

## Setting Up CI/CD

### **Required GitHub Secrets**
```bash
# Azure Service Principal
AZURE_CREDENTIALS='{"clientId":"...","clientSecret":"...","subscriptionId":"...","tenantId":"..."}'

# Database Credentials
POSTGRES_PASSWORD='YourStrongPassword123!'
JWT_SECRET='your-jwt-secret-key'

# Staging Database (optional)
STAGING_DB_HOST='staging-db.postgres.database.azure.com'
STAGING_DB_USER='stagingadmin'
STAGING_DB_PASSWORD='StagingPassword123!'
```

### **Required GitHub Variables**
```bash
AZURE_RESOURCE_GROUP='myapp-rg'
AZURE_LOCATION='eastus'
ACR_NAME='myappregistry'
APP_NAME='myapp'
```

### **Create Azure Service Principal**
```bash
az ad sp create-for-rbac \
  --name "myapp-github-actions" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID \
  --sdk-auth
```

---

## Advanced CI/CD Features

### **1. Environment Management**
- **Production**: Deploys from `main` branch
- **Staging**: Deploys from `develop` branch  
- **PR Environments**: Temporary environments for testing

### **2. Quality Gates**
- All tests must pass before deployment
- Security scans block vulnerable code
- Code coverage requirements
- Manual approval for production (optional)

### **3. Monitoring & Alerts**
- Deployment status notifications
- Performance monitoring
- Error tracking
- Automated rollbacks on failure

### **4. Blue-Green Deployments**
```yaml
# Zero-downtime deployment strategy
- name: Blue-Green Deploy
  run: |
    # Deploy to blue environment
    az containerapp revision copy \
      --name myapp-backend \
      --resource-group myapp-rg \
      --from-revision latest
    
    # Test blue environment
    # Switch traffic to blue
    # Deactivate green environment
```

---

## Terraform + CI/CD Integration

### **Infrastructure as Code Pipeline**
1. **Code Change** → Terraform plan runs
2. **PR Review** → Infrastructure changes reviewed
3. **Merge to Main** → Terraform apply executes
4. **Application Deploy** → Uses new infrastructure

### **Environment Consistency**
```hcl
# Same Terraform code creates all environments
resource "azurerm_container_app" "backend" {
  name = "${var.app_name}-${var.environment}-backend"
  # ... configuration
}
```

### **Secrets Management**
```hcl
# Terraform manages secrets securely
resource "azurerm_container_app" "backend" {
  secret {
    name  = "db-password"
    value = var.postgres_admin_password  # From GitHub Secrets
  }
}
```

---

## Getting Started

### **1. Set Up Secrets**
Go to GitHub → Settings → Secrets and Variables → Actions

### **2. Enable Workflows**
```bash
git add .github/workflows/
git commit -m "Add CI/CD workflows"
git push
```

### **3. Create Feature Branch**
```bash
git checkout -b feature/new-feature
# Make changes
git push origin feature/new-feature
# Create PR → Staging environment auto-created
```

### **4. Deploy to Production**
```bash
git checkout main
git merge feature/new-feature
git push origin main
# Production deployment auto-triggered
```

<function_calls>
<invoke name="todo_list">
<parameter name="todos">[{"id": "1", "content": "Explain Terraform basics and why it's useful", "status": "completed", "priority": "high"}, {"id": "2", "content": "Create Terraform configuration for this project", "status": "completed", "priority": "high"}, {"id": "3", "content": "Explain CI/CD basics and benefits", "status": "completed", "priority": "high"}, {"id": "4", "content": "Set up GitHub Actions workflow for this project", "status": "completed", "priority": "high"}, {"id": "5", "content": "Add advanced CI/CD features (staging, testing, etc.)", "status": "completed", "priority": "medium"}]
