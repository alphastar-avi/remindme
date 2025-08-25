package models

import (
	"time"
)

type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Username  string    `json:"username" gorm:"unique;not null"`
	Password  string    `json:"-" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	
	// Relationships
	Reminders []Reminder `json:"reminders" gorm:"foreignKey:CreatedBy"`
}

type Group struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"not null"`
	CreatedBy   uint      `json:"created_by" gorm:"not null"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	
	// Relationships
	Creator   User       `json:"creator" gorm:"foreignKey:CreatedBy"`
	Reminders []Reminder `json:"reminders" gorm:"foreignKey:GroupID"`
}

type Reminder struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Title       string    `json:"title" gorm:"not null"`
	Description string    `json:"description"`
	GroupID     uint      `json:"group_id" gorm:"not null"`
	CreatedBy   uint      `json:"created_by" gorm:"not null"`
	Completed   bool      `json:"completed" gorm:"default:false"`
	DueDate     *time.Time `json:"due_date"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	
	// Relationships
	Group   Group `json:"group" gorm:"foreignKey:GroupID"`
	Creator User  `json:"creator" gorm:"foreignKey:CreatedBy"`
}


// Request/Response DTOs
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type CreateGroupRequest struct {
	Name string `json:"name" binding:"required,min=1,max=100"`
}

type CreateReminderRequest struct {
	Title       string     `json:"title" binding:"required,min=1,max=200"`
	Description string     `json:"description"`
	DueDate     *time.Time `json:"due_date"`
}

type UpdateReminderRequest struct {
	Title       *string    `json:"title"`
	Description *string    `json:"description"`
	Completed   *bool      `json:"completed"`
	DueDate     *time.Time `json:"due_date"`
}
