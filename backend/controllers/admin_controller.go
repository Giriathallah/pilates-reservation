package controllers

import (
	"fmt"
	"time"

	"github.com/Giriathallah/diro-pilates-backend/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type AdminController struct {
	DB *gorm.DB
}

func NewAdminController(db *gorm.DB) *AdminController {
	return &AdminController{DB: db}
}

// GetDashboardStats returns actionable summary metrics
func (ac *AdminController) GetDashboardStats(c *fiber.Ctx) error {
	var totalRevenueToday float64
	var activeSessionsToday int64
	var pendingActions int64
	agenda := []fiber.Map{} // Initialize as empty slice to avoid null JSON

	today := time.Now().Truncate(24 * time.Hour)

	// 1. Revenue Today (Paid reservations updated today)
	ac.DB.Model(&models.Reservation{}).
		Where("status = ? AND updated_at >= ?", "paid", today).
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&totalRevenueToday)

	// 2. Active Sessions Today (Reservations for today's schedules)
	// Join reservation -> schedule where schedule.date = today
	ac.DB.Model(&models.Reservation{}).
		Joins("JOIN schedules ON schedules.id = reservations.schedule_id").
		Where("schedules.date = ? AND reservations.status IN ('paid', 'confirmed')", today).
		Count(&activeSessionsToday)

	// 3. Pending Actions (All pending reservations)
	ac.DB.Model(&models.Reservation{}).
		Where("status = ?", "pending").
		Count(&pendingActions)

	// 4. Agenda (All schedules today)
	var schedules []models.Schedule
	ac.DB.Preload("Court").
		Where("date = ?", today).
		Order("start_time ASC").
		Find(&schedules)

	// Construct Agenda: For each schedule, find if there are bookings
	for _, s := range schedules {
		var bookings []models.Reservation
		ac.DB.Preload("User").Where("schedule_id = ? AND status IN ('paid', 'confirmed', 'pending')", s.ID).Find(&bookings)

		status := "Available"
		customerName := ""
		statusColor := "green" // green, yellow, red, grey

		// Capacity Logic for Agenda display
		if !s.IsAvailable {
			status = "Full / Closed"
			statusColor = "red"
		}

		if len(bookings) > 0 {
			// Simplified: Show first booker or "X Bookings"
			if len(bookings) == 1 {
				customerName = bookings[0].User.Name
				if bookings[0].Status == "pending" {
					status = "Pending"
					statusColor = "yellow"
				} else {
					status = "Booked"
					statusColor = "blue"
				}
			} else {
				status = fmt.Sprintf("%d Bookings", len(bookings))
				statusColor = "blue"
			}
		} else if !s.IsAvailable {
			statusColor = "grey" // Maintenance or just manually closed
		}

		agenda = append(agenda, fiber.Map{
			"schedule_id":  s.ID,
			"court_name":   s.Court.Name,
			"time":         s.StartTime + " - " + s.EndTime,
			"status":       status,
			"status_color": statusColor,
			"customer":     customerName,
			"bookings":     bookings, // Send full list if needed
			"is_available": s.IsAvailable,
		})
	}

	return c.JSON(fiber.Map{
		"revenue_today":   totalRevenueToday,
		"active_sessions": activeSessionsToday,
		"pending_actions": pendingActions,
		"agenda":          agenda,
	})
}

type CreateManualReservationInput struct {
	ScheduleID   string `json:"schedule_id" validate:"required,uuid"`
	CustomerName string `json:"customer_name"` // For manual, we might create a dummy user or just notes?
	// Ideally we link to a user. For simplicity, let's look up user by email OR assume it's a "Walk-in" generic user if needed.
	// Let's require an existing user email OR create a walk-in user.
	// Simpler: Just Notes for now, and link to a generic "Walk-In" user or requires Admin to pick a user?
	// User requested "Manual Booking". Let's assume selecting a user or plain text.
	// Given the constraints and existing relations, we MUST have a UserID.
	// Let's assume the Admin selects a User from a dropdown or inputs an email.
	// Protocol: Admin inputs Email. If exists, use it. If not, create temp user?
	// Simplify: Admin provides Email.
	UserEmail string `json:"user_email"`
	Notes     string `json:"notes"`
}

// CreateManualReservation allows admin to book for a user
func (ac *AdminController) CreateManualReservation(c *fiber.Ctx) error {
	var input CreateManualReservationInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	// 1. Find User by Email
	var user models.User
	if err := ac.DB.Where("email = ?", input.UserEmail).First(&user).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found with that email"})
	}

	// 2. Lock Schedule & Check Capacity (Reusing logic logic)
	tx := ac.DB.Begin()

	var schedule models.Schedule
	if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&schedule, "id = ?", input.ScheduleID).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Schedule not found"})
	}

	// Check availability only if strict? Admin can override?
	// Let's respect capacity.
	var court models.Court
	tx.First(&court, "id = ?", schedule.CourtID)

	var currentBookings int64
	tx.Model(&models.Reservation{}).
		Where("schedule_id = ? AND status IN ('pending', 'paid', 'confirmed')", schedule.ID).
		Count(&currentBookings)

	if int(currentBookings) >= court.Capacity {
		tx.Rollback()
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Fully booked"})
	}

	// Create Reservation (Paid directly)
	reservation := models.Reservation{
		UserID:      user.ID,
		CourtID:     schedule.CourtID,
		ScheduleID:  schedule.ID,
		Status:      "paid", // Admin booking is considered paid/confirmed
		TotalAmount: court.PricePerSlot,
		Notes:       "Manual Booking: " + input.Notes,
	}

	if err := tx.Create(&reservation).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create"})
	}

	// Create Dummy Payment record for consistency (Cash)
	payment := models.Payment{
		ReservationID:   reservation.ID,
		MidtransOrderID: "MANUAL-" + reservation.ID,
		Amount:          reservation.TotalAmount,
		Status:          "success",
		PaymentMethod:   "manual_cash",
	}
	tx.Create(&payment)

	// Update schedule if full
	if int(currentBookings)+1 >= court.Capacity {
		tx.Model(&schedule).Update("is_available", false)
	}

	tx.Commit()

	return c.JSON(fiber.Map{"message": "Manual booking created"})
}
