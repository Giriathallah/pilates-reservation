package middleware

import (
	"github.com/gofiber/fiber/v2"
)

func ErrorHandler(c *fiber.Ctx, err error) error {
	// Default status code = 500
	code := fiber.StatusInternalServerError

	// If it's a Fiber error, use the specific status code
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}

	// Format Response
	return c.Status(code).JSON(fiber.Map{
		"success": false,
		"error":   err.Error(),
		"code":    code,
	})
}
