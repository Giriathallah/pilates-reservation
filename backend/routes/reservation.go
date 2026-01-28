package routes

import (
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"github.com/Giriathallah/diro-pilates-backend/controllers"
	"github.com/Giriathallah/diro-pilates-backend/middleware"
	"github.com/Giriathallah/diro-pilates-backend/services"
)

func SetupReservationRoutes(app *fiber.App, db *gorm.DB, mt *services.MidtransService) {
	resController := controllers.NewReservationController(db, mt)

	api := app.Group("/api")

	// Public routes (checking availability)
	api.Get("/dates/available", resController.GetAvailableDates)
	api.Get("/timeslots", resController.GetTimeSlots)
	api.Get("/dates/available", resController.GetAvailableDates)
	api.Get("/timeslots", resController.GetTimeSlots)
	api.Get("/courts/available", resController.GetAvailableCourts)
	api.Get("/schedules", resController.GetSchedules) // Optimized endpoint

	// Webhook Midtrans
	api.Post("/midtrans/webhook", resController.HandleMidtransNotification)

	// Protected routes
	reservation := api.Group("/reservations", middleware.Protected())
	reservation.Get("/my", resController.GetMyReservations)
	reservation.Post("/", resController.CreateReservation)
	reservation.Post("/:id/cancel", resController.CancelReservation)
}
