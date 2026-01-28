package models

import (
	"time"
)

type Reservation struct {
	ID          string    `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	UserID      string    `gorm:"type:uuid;not null" json:"user_id"`
	User        User      `gorm:"constraint:OnDelete:CASCADE;" json:"user"`
	CourtID     string    `gorm:"type:uuid;not null" json:"court_id"`
	Court       Court     `gorm:"constraint:OnDelete:CASCADE;" json:"court"`
	ScheduleID  string    `gorm:"type:uuid;not null;uniqueIndex" json:"schedule_id"`
	Schedule    Schedule  `gorm:"constraint:OnDelete:CASCADE;" json:"schedule"`
	Status      string    `gorm:"default:'pending';check:status IN ('pending', 'confirmed', 'paid', 'cancelled', 'refunded')" json:"status"`
	TotalAmount float64   `gorm:"type:decimal(10,2);not null" json:"total_amount"`
	Notes       string    `json:"notes"`
	Payment     *Payment  `gorm:"foreignKey:ReservationID" json:"payment"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}
