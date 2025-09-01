# Reminder App

A simple reminder application with React frontend and Go backend, designed for Azure deployment.

<img width="1453" height="1029" alt="Screenshot 2025-09-01 at 2 37 36 PM" src="https://github.com/user-attachments/assets/53f0af02-8bf2-40fb-85d2-a761df16a97c" />
<img width="1453" height="1029" alt="Screenshot 2025-09-01 at 2 38 01 PM" src="https://github.com/user-attachments/assets/0d1c1fe3-511c-4a38-a002-c3cae19b4b0d" />



## Features

- User authentication (register/login)
- Group creation and management
- Shared reminders within groups
- Clean, modern UI with subtle animations
- Only reminder creators can delete their reminders

## Tech Stack

- **Frontend**: React with modern UI components
- **Backend**: Go with Gin framework
- **Database**: PostgreSQL with GORM
- **Containerization**: Docker
- **Deployment**: Azure-ready configuration

<img width="2296" height="848" alt="ReminderApp-2" src="https://github.com/user-attachments/assets/78649b82-5a7e-4cee-a9c8-b3a841c83733" />


## Quick Start

1. **Start with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

2. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Run backend**:
   ```bash
   cd backend
   go mod tidy
   go run main.go
   ```

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/groups` - List user's groups
- `POST /api/groups` - Create new group
- `GET /api/groups/:id/reminders` - Get group reminders
- `POST /api/groups/:id/reminders` - Create reminder
- `DELETE /api/reminders/:id` - Delete reminder (creator only)

## Environment Variables

- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT signing secret
