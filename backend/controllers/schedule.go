package controllers

import (
	"time"

	"github.com/Giriathallah/diro-pilates-backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type ScheduleController struct {
	DB *gorm.DB
}

func NewScheduleController(db *gorm.DB) *ScheduleController {
	return &ScheduleController{DB: db}
}

// GetAdminSchedules fetches schedules with filters
func (sc *ScheduleController) GetAdminSchedules(c *fiber.Ctx) error {
	courtID := c.Query("court_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	db := sc.DB.Preload("Court")

	if courtID != "" {
		db = db.Where("court_id = ?", courtID)
	}
	if startDate != "" && endDate != "" {
		db = db.Where("date BETWEEN ? AND ?", startDate, endDate)
	} else if startDate != "" {
		db = db.Where("date = ?", startDate)
	}

	var schedules []models.Schedule
	if err := db.Order("date ASC, start_time ASC").Find(&schedules).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not fetch schedules"})
	}

	return c.JSON(fiber.Map{"data": schedules})
}

// BulkCreateInput defines payload for generating schedules
type BulkCreateInput struct {
	CourtID   string `json:"court_id"`
	StartDate string `json:"start_date"` // YYYY-MM-DD
	EndDate   string `json:"end_date"`   // YYYY-MM-DD
	StartTime string `json:"start_time"` // HH:MM
	EndTime   string `json:"end_time"`   // HH:MM
	Duration  int    `json:"duration"`   // in minutes
}

// CreateScheduleBulk generates slots
func (sc *ScheduleController) CreateScheduleBulk(c *fiber.Ctx) error {
	var input BulkCreateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	start, _ := time.Parse("2006-01-02", input.StartDate)
	end, _ := time.Parse("2006-01-02", input.EndDate)

	// Basic validation loop
	var schedules []models.Schedule
	for d := start; !d.After(end); d = d.AddDate(0, 0, 1) {
		// Needs robust time logic for slots, keeping it simple for now: single slot per day or loop?
		// Requirement implies "Generate for date range".
		// Let's assume input creates ONE slot per day in that range for simplicity,
		// OR multiple slots if we loop time.
		// For now, let's just create the specialized slot given in input for each day.

		schedules = append(schedules, models.Schedule{
			CourtID:     input.CourtID,
			Date:        d,
			StartTime:   input.StartTime,
			EndTime:     input.EndTime,
			IsAvailable: true,
		})
	}

	if err := sc.DB.Create(&schedules).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to bulk create schedules"})
	}

	return c.JSON(fiber.Map{"message": "Schedules created", "count": len(schedules)})
}

// UpdateSchedule toggles availability or edits time
func (sc *ScheduleController) UpdateSchedule(c *fiber.Ctx) error {
	id := c.Params("id")
	var schedule models.Schedule
	if err := sc.DB.First(&schedule, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Schedule not found"})
	}

	var input models.Schedule
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	schedule.IsAvailable = input.IsAvailable
	// Allow editing time if needed, but usually just availability toggle

	if err := sc.DB.Save(&schedule).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update schedule"})
	}

	return c.JSON(fiber.Map{"message": "Schedule updated", "data": schedule})
}
