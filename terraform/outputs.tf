output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "container_registry_login_server" {
  description = "Container registry login server"
  value       = azurerm_container_registry.main.login_server
}

output "container_registry_admin_username" {
  description = "Container registry admin username"
  value       = azurerm_container_registry.main.admin_username
  sensitive   = true
}

output "postgres_server_fqdn" {
  description = "PostgreSQL server FQDN"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "backend_url" {
  description = "Backend application URL"
  value       = "https://${azurerm_container_app.backend.latest_revision_fqdn}"
}

output "frontend_url" {
  description = "Frontend application URL"
  value       = "https://${azurerm_static_web_app.frontend.default_host_name}"
}

output "static_web_app_api_key" {
  description = "Static Web App deployment token"
  value       = azurerm_static_web_app.frontend.api_key
  sensitive   = true
}
