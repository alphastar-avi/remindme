package handlers

import (
	"net/http"
	"strconv"

	"reminder-app/config"
	"reminder-app/models"

	"github.com/gin-gonic/gin"
)

func CreateReminder(c *gin.Context) {
	groupID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
		return
	}

	var req models.CreateReminderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetUint("user_id")

	// Check if group exists
	var group models.Group
	if err := config.DB.First(&group, groupID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	}

	reminder := models.Reminder{
		Title:       req.Title,
		Description: req.Description,
		GroupID:     uint(groupID),
		CreatedBy:   userID,
		DueDate:     req.DueDate,
	}

	if err := config.DB.Create(&reminder).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create reminder"})
		return
	}

	// Load reminder with creator information
	config.DB.Preload("Creator").First(&reminder, reminder.ID)

	c.JSON(http.StatusCreated, reminder)
}

func GetGroupReminders(c *gin.Context) {
	groupID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
		return
	}

	// Check if group exists
	var group models.Group
	if err := config.DB.First(&group, groupID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	}

	var reminders []models.Reminder
	if err := config.DB.Where("group_id = ?", groupID).
		Preload("Creator").
		Order("created_at DESC").
		Find(&reminders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reminders"})
		return
	}

	c.JSON(http.StatusOK, reminders)
}

func UpdateReminder(c *gin.Context) {
	reminderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reminder ID"})
		return
	}

	var req models.UpdateReminderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find reminder
	var reminder models.Reminder
	if err := config.DB.First(&reminder, reminderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Reminder not found"})
		return
	}

	// Update fields if provided
	updates := make(map[string]interface{})
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Completed != nil {
		updates["completed"] = *req.Completed
	}
	if req.DueDate != nil {
		updates["due_date"] = req.DueDate
	}

	if err := config.DB.Model(&reminder).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update reminder"})
		return
	}

	// Load updated reminder with creator information
	config.DB.Preload("Creator").First(&reminder, reminder.ID)

	c.JSON(http.StatusOK, reminder)
}

func DeleteReminder(c *gin.Context) {
	reminderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reminder ID"})
		return
	}

	// Find reminder
	var reminder models.Reminder
	if err := config.DB.First(&reminder, reminderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Reminder not found"})
		return
	}

	if err := config.DB.Delete(&reminder).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete reminder"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Reminder deleted successfully"})
}
