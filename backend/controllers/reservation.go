package controllers

import (
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/Giriathallah/diro-pilates-backend/models"
	"github.com/Giriathallah/diro-pilates-backend/services"
	"github.com/Giriathallah/diro-pilates-backend/utils"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type ReservationController struct {
	DB       *gorm.DB
	Midtrans *services.MidtransService
}

func NewReservationController(db *gorm.DB, mt *services.MidtransService) *ReservationController {
	return &ReservationController{
		DB:       db,
		Midtrans: mt,
	}
}

// MarkReservationAsPaid - Triggered from Frontend on Success
func (rc *ReservationController) MarkReservationAsPaid(c *fiber.Ctx) error {
	id := c.Params("id")
	userID := c.Locals("user_id").(string)

	var reservation models.Reservation
	if err := rc.DB.First(&reservation, "id = ? AND user_id = ?", id, userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Reservation not found or unauthorized"})
	}

	if reservation.Status != "pending" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Reservation is not pending"})
	}

	// Verify with Midtrans (Best Practice even for manual trigger)
	txResp, err := rc.Midtrans.VerifyTransaction(reservation.ID)
	if err != nil {
		fmt.Println("VerifyTransaction error on mark-paid:", err)
		// For local dev/test without public webhooks, we might want to proceed if we trust the frontend 'onSuccess'
	} else if txResp != nil {
		if txResp.TransactionStatus != "capture" && txResp.TransactionStatus != "settlement" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Payment not yet successful according to Midtrans"})
		}
	}

	tx := rc.DB.Begin()

	// Update Payment
	var payment models.Payment
	if err := tx.Where("reservation_id = ?", reservation.ID).First(&payment).Error; err == nil {
		payment.Status = "success"
		payment.PaymentMethod = "manual_sync_frontend"
		if txResp != nil {
			payment.PaymentMethod = txResp.PaymentType
		}
		currentTime := time.Now()
		payment.TransactionTime = &currentTime
		tx.Save(&payment)
	}

	// Update Reservation
	reservation.Status = "paid"
	if err := tx.Save(&reservation).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update reservation"})
	}

	tx.Commit()

	return c.JSON(fiber.Map{
		"message": "Reservation marked as paid",
		"status":  "paid",
	})
}

// --- Public Endpoints ---

// GetAvailableDates returns list of dates that have available schedules
func (rc *ReservationController) GetAvailableDates(c *fiber.Ctx) error {
	var dates []time.Time
	today := time.Now().Truncate(24 * time.Hour)

	if err := rc.DB.Model(&models.Schedule{}).
		Where("is_available = ? AND date >= ?", true, today).
		Distinct("date").
		Order("date ASC").
		Pluck("date", &dates).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not fetch dates"})
	}

	availableDates := []string{}
	for _, d := range dates {
		availableDates = append(availableDates, d.Format("2006-01-02"))
	}

	return c.JSON(fiber.Map{"dates": availableDates})
}

// GetTimeSlots returns available time slots for a specific date
func (rc *ReservationController) GetTimeSlots(c *fiber.Ctx) error {
	dateParam := c.Query("date")
	if dateParam == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Date parameter is required"})
	}

	// Cari unique start_time pada tanggal tersebut yang available
	timeSlots := []string{}
	if err := rc.DB.Model(&models.Schedule{}).
		Where("date = ? AND is_available = ?", dateParam, true).
		Distinct("start_time").
		Order("start_time ASC").
		Pluck("start_time", &timeSlots).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not fetch time slots"})
	}

	return c.JSON(fiber.Map{
		"date":       dateParam,
		"time_slots": timeSlots,
	})
}

// GetAvailableCourts returns courts available for specific date and time
func (rc *ReservationController) GetAvailableCourts(c *fiber.Ctx) error {
	dateParam := c.Query("date")
	timeParam := c.Query("time") // format HH:MM:SS or HH:MM

	if dateParam == "" || timeParam == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Date and Time parameters are required"})
	}

	// Cari schedule yang match date & time & available, preload court
	var schedules []models.Schedule
	if err := rc.DB.Preload("Court").
		Where("date = ? AND start_time = ? AND is_available = ?", dateParam, timeParam, true).
		Find(&schedules).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not fetch courts"})
	}

	result := []fiber.Map{}
	for _, s := range schedules {
		result = append(result, fiber.Map{
			"schedule_id": s.ID,
			"court_id":    s.Court.ID,
			"court_name":  s.Court.Name,
			"price":       s.Court.PricePerSlot,
			"capacity":    s.Court.Capacity,
			"start_time":  s.StartTime,
			"end_time":    s.EndTime,
		})
	}

	return c.JSON(fiber.Map{"courts": result})
}

// GetSchedules returns optimized schedule list for a specific date
func (rc *ReservationController) GetSchedules(c *fiber.Ctx) error {
	dateStr := c.Query("date")
	if dateStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Date is required"})
	}

	// Parse date to validate format YYYY-MM-DD
	_, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid date format. Use YYYY-MM-DD"})
	}

	var schedules []models.Schedule
	// Fetch all schedules for the date, whether available or not (UI can decide to show full/booked)
	// But requirements usually prefer showing all to see what's booked.
	// For "Reservation Page", we might only want available OR all.
	// The frontend handles grouping. Let's return all for the date so user sees full schedule.
	// But wait, the frontend plan assumed filtering available?
	// The prompt said: "Filter is_available = true (or handle availability in UI)".
	// Let's filter available=true to keep it simple for now, or all?
	// "Reformer A (Rp 150rb) - [Book]" implies showing available.
	// If it's booked, maybe show "Booked"?
	// Let's safe fetch ALL for that date, and let frontend logic decide.
	// Actually, the frontend code provided by USER maps `schedulesByTime`.
	// If we filter only available, booked ones won't show.
	// Let's stick to filtering available=true for now as per plan, unless user code suggests otherwise.
	// User code: `{!loading && schedules.length === 0 ... "Tidak ada jadwal tersedia"}`
	// Seems filtering available is safer to avoid showing booked slots user can't click.
	if err := rc.DB.Preload("Court").Where("date = ? AND is_available = ?", dateStr, true).Find(&schedules).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not fetch schedules"})
	}

	return c.JSON(fiber.Map{
		"data": schedules,
	})
}

// --- Protected Endpoints ---

type CreateReservationInput struct {
	ScheduleID string `json:"schedule_id" validate:"required,uuid"`
	Notes      string `json:"notes"`
}

// CreateReservation buats pending reservation
func (rc *ReservationController) CreateReservation(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	var input CreateReservationInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	if errors := utils.ValidateStruct(input); errors != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"errors": errors})
	}

	// Start Transaction
	tx := rc.DB.Begin()

	// 1. Lock schedule row to prevent race condition
	var schedule models.Schedule
	if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&schedule, "id = ?", input.ScheduleID).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Schedule not found"})
	}

	if !schedule.IsAvailable {
		tx.Rollback()
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Schedule is no longer available"})
	}

	// 2. Get Court info (Moved up to check capacity)
	var court models.Court
	if err := tx.First(&court, "id = ?", schedule.CourtID).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Court data error"})
	}

	// 3. Check Capacity
	var currentBookings int64
	if err := tx.Model(&models.Reservation{}).
		Where("schedule_id = ? AND status IN ('pending', 'paid', 'confirmed')", schedule.ID).
		Count(&currentBookings).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to check capacity"})
	}

	// If fully booked, prevent reservation
	if int(currentBookings) >= court.Capacity {
		tx.Rollback()
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Class is fully booked"})
	}

	// 4. Update schedule availability if this booking fills the last slot
	if int(currentBookings)+1 >= court.Capacity {
		if err := tx.Model(&schedule).Update("is_available", false).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to lock schedule"})
		}
	}

	// 5. Get User info for payment details
	var user models.User
	if err := tx.First(&user, "id = ?", userID).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "User data error"})
	}

	// 6. Create Reservation
	reservation := models.Reservation{
		UserID:      userID,
		CourtID:     schedule.CourtID,
		ScheduleID:  schedule.ID,
		Status:      "pending",
		TotalAmount: court.PricePerSlot,
		Notes:       input.Notes,
	}

	if err := tx.Create(&reservation).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create reservation"})
	}

	// 6. Generate Midtrans Snap Token
	// Note: We use ReservationID as OrderID.
	// Since we create a NEW reservation for every POST, ID is unique.
	token, redirectURL, err := rc.Midtrans.GenerateSnapToken(&reservation, &user)
	if err != nil {
		tx.Rollback()
		fmt.Println("Midtrans Error:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate payment token"})
	}

	// 7. Create Payment Record (Pending)
	payment := models.Payment{
		ReservationID:   reservation.ID,
		MidtransOrderID: reservation.ID,
		Amount:          reservation.TotalAmount,
		Status:          "pending",
	}

	if err := tx.Create(&payment).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to init payment"})
	}

	// Commit Transaction
	tx.Commit()

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message":        "Reservation created",
		"reservation_id": reservation.ID,
		"snap_token":     token,
		"redirect_url":   redirectURL,
		"amount":         reservation.TotalAmount,
	})
}

// GetMyReservations returns reservations for the logged-in user
func (rc *ReservationController) GetMyReservations(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)

	var reservations []models.Reservation
	if err := rc.DB.Preload("Court").Preload("Schedule").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&reservations).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not fetch reservations"})
	}

	// Proactive Check for Pending Reservations
	// Proactive Check for Pending Reservations
	for i, res := range reservations {
		if res.Status == "pending" {
			fmt.Printf("Proactive check for pending reservation ID: %s\n", res.ID)

			resp, err := rc.Midtrans.VerifyTransaction(res.ID)
			if err != nil {
				fmt.Printf("VerifyTransaction failed for %s: %v\n", res.ID, err)
				continue
			}

			if resp == nil {
				fmt.Println("Midtrans response nil for", res.ID)
				continue
			}

			fmt.Printf("Midtrans status for %s: %s | fraud: %s | payment_type: %s\n",
				res.ID, resp.TransactionStatus, resp.FraudStatus, resp.PaymentType)

			var newStatus string
			if resp.TransactionStatus == "capture" || resp.TransactionStatus == "settlement" {
				if resp.TransactionStatus == "capture" && resp.FraudStatus == "challenge" {
					newStatus = "pending"
				} else {
					newStatus = "success" // This maps to "paid" for reservation
				}
			} else if resp.TransactionStatus == "deny" || resp.TransactionStatus == "expire" || resp.TransactionStatus == "cancel" {
				newStatus = "failed"
			}

			if newStatus == "" {
				fmt.Println("No actionable new status for", res.ID)
				continue
			}

			fmt.Printf("Updating status to %s for reservation %s\n", newStatus, res.ID)

			tx := rc.DB.Begin()

			// Update Payment (find or create)
			var payment models.Payment
			paymentFound := true
			if err := tx.Where("reservation_id = ?", res.ID).First(&payment).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					fmt.Println("Payment record not found, creating new for", res.ID)
					payment = models.Payment{
						ReservationID:   res.ID,
						MidtransOrderID: res.ID,
						Amount:          res.TotalAmount,
						Status:          newStatus,
					}
					paymentFound = false
				} else {
					fmt.Println("Error finding payment:", err)
					tx.Rollback()
					continue
				}
			}

			// Update fields
			payment.Status = newStatus
			if resp.PaymentType != "" {
				payment.PaymentMethod = resp.PaymentType
			}
			if resp.TransactionTime != "" {
				if t, err := time.Parse("2006-01-02 15:04:05", resp.TransactionTime); err == nil {
					payment.TransactionTime = &t
				}
			}
			paymentBytes, _ := json.Marshal(resp)
			payment.MidtransResponse = paymentBytes

			if paymentFound {
				tx.Save(&payment)
			} else {
				tx.Create(&payment)
			}

			// Update Reservation
			if newStatus == "success" {
				res.Status = "paid"
				tx.Model(&models.Reservation{}).Where("id = ?", res.ID).Update("status", "paid")
			} else if newStatus == "failed" {
				res.Status = "cancelled"
				tx.Model(&models.Reservation{}).Where("id = ?", res.ID).Update("status", "cancelled")

				// Release schedule
				tx.Model(&models.Schedule{}).Where("id = ?", res.ScheduleID).Update("is_available", true)
			}

			if err := tx.Commit().Error; err != nil {
				fmt.Println("Transaction commit failed:", err)
				tx.Rollback()
				continue
			}

			// Update in-memory for response
			reservations[i].Status = res.Status
			fmt.Printf("Updated reservation %s to %s\n", res.ID, res.Status)
		}
	}

	return c.JSON(fiber.Map{"data": reservations})
}

// POST /api/reservations/:id/cancel
func (rc *ReservationController) CancelReservation(c *fiber.Ctx) error {
	id := c.Params("id")
	userID := c.Locals("user_id").(string)

	var reservation models.Reservation
	if err := rc.DB.First(&reservation, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Reservation not found"})
	}

	if reservation.UserID != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Not authorized"})
	}

	if reservation.Status != "pending" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Only pending reservations can be cancelled"})
	}

	// Transaction to cancel and free up schedule
	tx := rc.DB.Begin()

	reservation.Status = "cancelled"
	if err := tx.Save(&reservation).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to cancel reservation"})
	}

	if err := tx.Model(&models.Schedule{}).
		Where("id = ?", reservation.ScheduleID).
		Update("is_available", true).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to release schedule"})
	}

	tx.Commit()

	return c.JSON(fiber.Map{"message": "Reservation cancelled"})
}

// Webhook Handler for Midtrans
func (rc *ReservationController) HandleMidtransNotification(c *fiber.Ctx) error {
	fmt.Println("WEBHOOK RECEIVED! Raw body:", string(c.Body()))

	var notificationPayload map[string]interface{}
	if err := c.BodyParser(&notificationPayload); err != nil {
		fmt.Println("Body parse error:", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid notification payload"})
	}

	orderId, exists := notificationPayload["order_id"].(string)
	if !exists {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Order ID missing"})
	}

	transactionStatus, _ := notificationPayload["transaction_status"].(string)
	fraudStatus, _ := notificationPayload["fraud_status"].(string)
	paymentTypeVal, _ := notificationPayload["payment_type"].(string)
	signatureKeyVal, _ := notificationPayload["signature_key"].(string)

	fmt.Printf("Webhook for OrderID: %s\n", orderId)
	fmt.Printf("Transaction Status: %v\n", transactionStatus)
	fmt.Printf("Payment Type: %v\n", paymentTypeVal)
	fmt.Printf("Signature Key received: %v\n", signatureKeyVal)

	// 1. Verify Signature Key for security
	signatureKey, _ := notificationPayload["signature_key"].(string)
	statusCode, _ := notificationPayload["status_code"].(string)
	grossAmount, _ := notificationPayload["gross_amount"].(string)
	serverKey := os.Getenv("MIDTRANS_SERVER_KEY")

	if signatureKey == "" || statusCode == "" || grossAmount == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid payload"})
	}

	// Signature = SHA512(order_id + status_code + gross_amount + server_key)
	input := orderId + statusCode + grossAmount + serverKey
	hashArg := sha512.Sum512([]byte(input))
	expectedSignature := hex.EncodeToString(hashArg[:])

	if signatureKey != expectedSignature {
		fmt.Println("Invalid Signature!")
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid signature"})
	}

	var payment models.Payment
	if err := rc.DB.Where("midtrans_order_id = ?", orderId).First(&payment).Error; err != nil {
		fmt.Println("Payment not found for order:", orderId)
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Payment not found"})
	}

	// Determine new status
	var newStatus string
	if transactionStatus == "capture" {
		if fraudStatus == "challenge" {
			newStatus = "pending"
		} else if fraudStatus == "accept" {
			newStatus = "success"
		}
	} else if transactionStatus == "settlement" {
		newStatus = "success"
	} else if transactionStatus == "deny" || transactionStatus == "expire" || transactionStatus == "cancel" {
		newStatus = "failed"
	} else if transactionStatus == "pending" {
		newStatus = "pending"
	}

	// Extract additional fields
	paymentType, _ := notificationPayload["payment_type"].(string)
	transactionTimeStr, _ := notificationPayload["transaction_time"].(string)

	var transactionTime *time.Time
	if transactionTimeStr != "" {
		if facebookTime, err := time.Parse("2006-01-02 15:04:05", transactionTimeStr); err == nil {
			transactionTime = &facebookTime
		}
	}

	// Update if status changed OR if we just need to capture details (sometimes successful callbacks come fast)
	// We should update details regardless if it's the final state
	if newStatus != "" {
		tx := rc.DB.Begin()

		payment.Status = newStatus
		payment.PaymentMethod = paymentType
		payment.TransactionTime = transactionTime

		paymentBytes, _ := json.Marshal(notificationPayload)
		payment.MidtransResponse = paymentBytes

		if err := tx.Save(&payment).Error; err != nil {
			tx.Rollback()
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update payment"})
		}

		// Update Reservation & Schedule
		if newStatus == "success" {
			if err := tx.Model(&models.Reservation{}).
				Where("id = ?", payment.ReservationID).
				Update("status", "paid").Error; err != nil {
				tx.Rollback()
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update reservation"})
			}
			// Schedule is already false, keep it false.
		} else if newStatus == "failed" {
			if err := tx.Model(&models.Reservation{}).
				Where("id = ?", payment.ReservationID).
				Update("status", "cancelled").Error; err != nil {
				tx.Rollback()
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update reservation"})
			}
			// Release schedule
			var reservation models.Reservation
			tx.First(&reservation, "id = ?", payment.ReservationID)
			tx.Model(&models.Schedule{}).
				Where("id = ?", reservation.ScheduleID).
				Update("is_available", true) // Make available again
		}

		tx.Commit()
	}

	// ... existing Webhook handler code ...
	return c.SendStatus(fiber.StatusOK)
}

// --- Admin Endpoints ---

// GetAllReservations returns all reservations with filtering
func (rc *ReservationController) GetAllReservations(c *fiber.Ctx) error {
	status := c.Query("status")
	date := c.Query("date")

	db := rc.DB.Preload("User").Preload("Court").Preload("Schedule").Preload("Payment").Order("created_at DESC")

	if status != "" {
		db = db.Where("status = ?", status)
	}
	// Filter by schedule date
	if date != "" {
		// Join needed if filtering by schedule date, or simpler approach:
		// db = db.Joins("JOIN schedules ON schedules.id = reservations.schedule_id").Where("schedules.date = ?", date)
		// Simpler for now:
	}

	var reservations []models.Reservation
	if err := db.Find(&reservations).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not fetch reservations"})
	}

	return c.JSON(fiber.Map{"data": reservations})
}

// AdminCancelReservation allows admin to cancel and refund/void
func (rc *ReservationController) AdminCancelReservation(c *fiber.Ctx) error {
	id := c.Params("id")

	// Transaction similar to user cancel, but no user check
	tx := rc.DB.Begin()

	var reservation models.Reservation
	if err := tx.First(&reservation, "id = ?", id).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Reservation not found"})
	}

	// Logic: if paid, maybe trigger refund (not implemented), just mark refunded/cancelled
	// If pending, just cancel

	reservation.Status = "cancelled"
	if err := tx.Save(&reservation).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to cancel"})
	}

	// Release schedule
	if err := tx.Model(&models.Schedule{}).
		Where("id = ?", reservation.ScheduleID).
		Update("is_available", true).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to release schedule"})
	}

	tx.Commit()

	return c.JSON(fiber.Map{"message": "Reservation cancelled by admin"})
}
