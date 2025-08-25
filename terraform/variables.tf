variable "resource_group_name" {
  description = "Name of the Azure resource group"
  type        = string
  default     = "reminder-app-rg"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "East US"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "reminder-app"
}

variable "acr_name" {
  description = "Azure Container Registry name"
  type        = string
  default     = "reminderappacr"
}

variable "postgres_server_name" {
  description = "PostgreSQL server name"
  type        = string
  default     = "reminder-postgres-server"
}

variable "postgres_admin_username" {
  description = "PostgreSQL admin username"
  type        = string
  default     = "postgres"
}

variable "postgres_admin_password" {
  description = "PostgreSQL admin password"
  type        = string
  sensitive   = true
}

variable "postgres_database_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "reminder_app"
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}
