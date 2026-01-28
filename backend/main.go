package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/Giriathallah/diro-pilates-backend/controllers"
	"github.com/Giriathallah/diro-pilates-backend/middleware"
	"github.com/Giriathallah/diro-pilates-backend/models"
	"github.com/Giriathallah/diro-pilates-backend/routes"
	"github.com/Giriathallah/diro-pilates-backend/seed"
	"github.com/Giriathallah/diro-pilates-backend/services"
)

var DB *gorm.DB

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Singapore",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect database:", err)
	}

	// Enable UUID extension (jalankan sekali)
	DB.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")

	// AutoMigrate semua model (ini akan create tabel + update kolom jika perlu)
	err = DB.AutoMigrate(
		&models.User{},
		&models.Court{},
		&models.Schedule{},
		&models.Reservation{},
		&models.Payment{},
	)
	if err != nil {
		log.Fatal("AutoMigrate failed:", err)
	}

	// if err := godotenv.Load(); err != nil {
	// 	log.Println("Warning: .env file not found")
	// }
	// di NewMidtransService()

	// Jalankan seeder hanya di development (atau via flag)
	if os.Getenv("APP_ENV") == "development" {
		log.Println("Running database seeder...")
		seed.Run(DB) // function seeder
	}

	// Services
	midtransService := services.NewMidtransService()

	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
	})

	app.Use(logger.New()) // Logging middleware

	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
	}))

	// Setup routes
	setupRoutes(app, midtransService)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}
	log.Fatal(app.Listen(":" + port))
}

func setupRoutes(app *fiber.App, mt *services.MidtransService) {
	routes.SetupAuthRoutes(app, DB)
	routes.SetupReservationRoutes(app, DB, mt)

	// Admin Routes (Initialize controllers needed)
	adminCtrl := controllers.NewAdminController(DB)
	courtCtrl := controllers.NewCourtController(DB)
	scheduleCtrl := controllers.NewScheduleController(DB)
	resCtrl := controllers.NewReservationController(DB, mt)

	routes.SetupAdminRoutes(app, DB, adminCtrl, courtCtrl, scheduleCtrl, resCtrl)

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Pilates API Running")
	})
}
