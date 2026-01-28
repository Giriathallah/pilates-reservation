package seed

import (
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/Giriathallah/diro-pilates-backend/models"
)

func Run(db *gorm.DB) {
	// 1. Seed Admin User (idempotent)
	var adminCount int64
	db.Model(&models.User{}).Where("email = ?", "admin@gmail.com").Count(&adminCount)
	if adminCount == 0 {
		// Hash password
		password := "asdasdasd"
		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("Failed to hash admin password: %v", err)
			return // atau panic jika critical
		}

		admin := models.User{
			Name:         "Admin User",
			Email:        "admin@gmail.com",
			PasswordHash: string(hash),
			Role:         "admin", // pastikan sesuai CHECK constraint di schema
		}

		if err := db.Create(&admin).Error; err != nil {
			log.Printf("Failed to seed admin user: %v", err)
		} else {
			log.Println("Admin user seeded successfully: admin@gmail.com / asdasdasd")
		}
	} else {
		log.Println("Admin user already exists, skipping...")
	}

	// 2. Seed Courts (existing code Anda, sedikit di-refine)
	// 2. Seed Courts
	var courtCount int64
	db.Model(&models.Court{}).Count(&courtCount)

	var allCourts []models.Court

	if courtCount == 0 {
		courts := []models.Court{
			{Name: "Court A", Description: "Standard Pilates", PricePerSlot: 50.00, Capacity: 4},
			{Name: "Court B", Description: "Premium with Mirror", PricePerSlot: 75.00, Capacity: 6},
		}

		for _, c := range courts {
			if err := db.Create(&c).Error; err != nil {
				log.Printf("Failed to seed court %s: %v", c.Name, err)
				continue
			}
			allCourts = append(allCourts, c)
		}
		log.Println("Courts seeded successfully")
	} else {
		log.Println("Courts already exist, fetching existing courts...")
		if err := db.Find(&allCourts).Error; err != nil {
			log.Printf("Failed to fetch existing courts: %v", err)
			return
		}
	}

	// 3. Seed Schedules (Independent check)
	var scheduleCount int64
	db.Model(&models.Schedule{}).Count(&scheduleCount)
	if scheduleCount == 0 {
		if len(allCourts) == 0 {
			log.Println("No courts found, cannot seed schedules.")
			return
		}

		today := time.Now().Truncate(24 * time.Hour) // truncate ke midnight hari ini

		for i := 0; i < 3; i++ { // 3 hari ke depan
			date := today.AddDate(0, 0, i)

			for _, court := range allCourts {
				schedules := []models.Schedule{
					{
						CourtID:     court.ID,
						Date:        date,
						StartTime:   "09:00:00",
						EndTime:     "10:00:00",
						IsAvailable: true,
					},
					{
						CourtID:     court.ID,
						Date:        date,
						StartTime:   "10:00:00",
						EndTime:     "11:00:00",
						IsAvailable: true,
					},
					{
						CourtID:     court.ID,
						Date:        date,
						StartTime:   "11:00:00",
						EndTime:     "12:00:00",
						IsAvailable: true,
					},
					// Bisa tambah slot sore/malam jika mau lebih realistis
					// {
					// 	CourtID:     court.ID,
					// 	Date:        date,
					// 	StartTime:   "16:00:00",
					// 	EndTime:     "17:00:00",
					// 	IsAvailable: true,
					// },
				}

				if err := db.Create(&schedules).Error; err != nil {
					log.Printf("Failed to seed schedules for court %s on %s: %v", court.Name, date.Format("2006-01-02"), err)
				}
			}
		}
		log.Println("Sample schedules seeded for 3 days")
	} else {
		log.Println("Schedules already exist, skipping...")
	}

	log.Println("Seeder completed")
}
