package controllers

import (
	"github.com/Giriathallah/diro-pilates-backend/models"
	"github.com/Giriathallah/diro-pilates-backend/utils"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type CourtController struct {
	DB *gorm.DB
}

func NewCourtController(db *gorm.DB) *CourtController {
	return &CourtController{DB: db}
}

// GetAllCourts returns all courts (admin view)
func (cc *CourtController) GetAllCourts(c *fiber.Ctx) error {
	var courts []models.Court
	if err := cc.DB.Find(&courts).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not fetch courts"})
	}
	return c.JSON(fiber.Map{"data": courts})
}

// CreateCourt adds a new court
func (cc *CourtController) CreateCourt(c *fiber.Ctx) error {
	var input models.Court
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	if errors := utils.ValidateStruct(input); errors != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"errors": errors})
	}

	// Assuming ID is auto-generated or UUID, if not we might need to handle it.
	// Models usually handle UUID generation GORM hooks.

	if err := cc.DB.Create(&input).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create court"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Court created", "data": input})
}

// UpdateCourt edits an existing court
func (cc *CourtController) UpdateCourt(c *fiber.Ctx) error {
	id := c.Params("id")
	var court models.Court

	if err := cc.DB.First(&court, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Court not found"})
	}

	var input models.Court
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid input"})
	}

	// Update fields
	court.Name = input.Name
	court.Description = input.Description
	court.Capacity = input.Capacity
	court.PricePerSlot = input.PricePerSlot
	// court.IsActive = input.IsActive // Assuming there's an IsActive field, if not check models

	if err := cc.DB.Save(&court).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update court"})
	}

	return c.JSON(fiber.Map{"message": "Court updated", "data": court})
}

// DeleteCourt removes a court
func (cc *CourtController) DeleteCourt(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := cc.DB.Delete(&models.Court{}, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete court"})
	}
	return c.JSON(fiber.Map{"message": "Court deleted"})
}
