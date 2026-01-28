package routes

import (
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"github.com/Giriathallah/diro-pilates-backend/controllers"
	"github.com/Giriathallah/diro-pilates-backend/middleware"
)

func SetupAuthRoutes(app *fiber.App, db *gorm.DB) {
	authController := controllers.NewAuthController(db)

	// Group utama /api
	api := app.Group("/api")

	// Public auth routes
	auth := api.Group("/auth")
	auth.Post("/register", authController.Register)
	auth.Post("/login", authController.Login)
	auth.Post("/logout", authController.Logout)

	// Protected routes
	auth.Get("/me", middleware.Protected(), authController.Me)
}
