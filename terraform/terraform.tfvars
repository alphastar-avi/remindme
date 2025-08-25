# Example Terraform variables file
# Copy this to terraform.tfvars and update with your values

resource_group_name = "reminder-app-rg"
location = "Central India"
environment = "prod"
app_name = "reminder-app"
acr_name = "reminderappacr2024avinash"  # Must be globally unique
postgres_server_name = "reminder-postgres-2024-avinash"  # Must be globally unique
postgres_admin_username = "postgres"
postgres_admin_password = "SecureReminder2024!"  # Change this!
postgres_database_name = "reminder_app"
jwt_secret = "reminder-jwt-secret-2024-production-key"  # Change this!
