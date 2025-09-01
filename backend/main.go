package main

import (
	"log"
	"os"

	"reminder-app/config"
	"reminder-app/handlers"
	"reminder-app/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Connect to database
	config.ConnectDatabase()

	// Initialize Gin router
	r := gin.Default()

	// CORS middleware - updated for Azure Static Web App
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "https://black-moss-02ad4ed00-preview.eastasia.1.azurestaticapps.net", "https://*.azurestaticapps.net", "https://*.azurewebsites.net"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy"})
	})

	// API routes
	api := r.Group("/api")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
		}

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// Group routes
			groups := protected.Group("/groups")
			{
				groups.POST("", handlers.CreateGroup)
				groups.GET("", handlers.GetUserGroups)
				groups.GET("/:id", handlers.GetGroup)
				groups.DELETE("/:id", handlers.DeleteGroup)
				groups.GET("/:id/reminders", handlers.GetGroupReminders)
				groups.POST("/:id/reminders", handlers.CreateReminder)
			}

			// Reminder routes
			reminders := protected.Group("/reminders")
			{
				reminders.PUT("/:id", handlers.UpdateReminder)
				reminders.DELETE("/:id", handlers.DeleteReminder)
			}
		}
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
