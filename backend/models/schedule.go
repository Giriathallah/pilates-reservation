package models

import (
	"time"
)

type Schedule struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	CourtID     string    `gorm:"type:uuid;not null" json:"court_id"`
	Court       Court     `gorm:"constraint:OnDelete:CASCADE;" json:"court"`
	Date        time.Time `gorm:"type:date;not null" json:"date"`
	StartTime   string    `gorm:"type:varchar(10);not null" json:"start_time"`
	EndTime     string    `gorm:"type:varchar(10);not null" json:"end_time"`
	IsAvailable bool      `gorm:"default:true" json:"is_available"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
