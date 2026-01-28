package models

import (
	"time"
)

type Payment struct {
	ID               string       `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	ReservationID    string       `gorm:"type:uuid;not null"`
	Reservation      *Reservation `gorm:"constraint:OnDelete:CASCADE;"`
	MidtransOrderID  string       `gorm:"uniqueIndex;not null"`
	Amount           float64      `gorm:"type:decimal(10,2);not null"`
	Status           string       `gorm:"default:'pending';check:status IN ('pending', 'success', 'failed', 'refunded')"`
	PaymentMethod    string
	TransactionTime  *time.Time
	ExpiryTime       *time.Time
	MidtransResponse []byte    `gorm:"type:jsonb"`
	CreatedAt        time.Time `gorm:"autoCreateTime"`
	UpdatedAt        time.Time `gorm:"autoUpdateTime"`
}
