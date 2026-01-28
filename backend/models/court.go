package models

import (
	"time"
)

type Court struct {
	ID           string    `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	Name         string    `gorm:"uniqueIndex;not null" json:"name"`
	Description  string    `json:"description"`
	Capacity     int       `gorm:"default:1" json:"capacity"`
	PricePerSlot float64   `gorm:"type:decimal(10,2);not null" json:"price_per_slot"`
	IsActive     bool      `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
