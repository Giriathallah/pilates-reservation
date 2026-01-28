package routes

import (
	"github.com/Giriathallah/diro-pilates-backend/controllers"
	"github.com/Giriathallah/diro-pilates-backend/middleware"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// SetupAdminRoutes registers routes under /api/admin
func SetupAdminRoutes(
	app *fiber.App,
	db *gorm.DB,
	adminController *controllers.AdminController,
	courtController *controllers.CourtController,
	scheduleController *controllers.ScheduleController,
	resController *controllers.ReservationController,
) {
	// Group routes
	admin := app.Group("/api/admin")

	// Apply Auth and Role Middleware
	// We should add a generic Role check middleware, but for now we can rely on Auth + check inside controller OR simplistic role middleware
	admin.Use(middleware.Protected())
	admin.Use(middleware.AdminOnly()) // Need to implement this

	// Stats
	admin.Get("/stats", adminController.GetDashboardStats)
	admin.Post("/manual-booking", adminController.CreateManualReservation)

	// Courts
	admin.Get("/courts", courtController.GetAllCourts)
	admin.Post("/courts", courtController.CreateCourt)
	admin.Put("/courts/:id", courtController.UpdateCourt)
	admin.Delete("/courts/:id", courtController.DeleteCourt)

	// Schedules
	admin.Get("/schedules", scheduleController.GetAdminSchedules)
	admin.Post("/schedules/bulk", scheduleController.CreateScheduleBulk)
	admin.Put("/schedules/:id", scheduleController.UpdateSchedule)

	// Reservations
	admin.Get("/reservations", resController.GetAllReservations)
	admin.Post("/reservations/:id/cancel", resController.AdminCancelReservation)
}
