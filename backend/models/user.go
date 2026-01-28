package models

import (
	"time"
)

type User struct {
	ID            string `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	Name          string
	Email         string `gorm:"uniqueIndex;not null"`
	PasswordHash  string `gorm:"not null"`
	Role          string `gorm:"default:'user'"`
	EmailVerified *time.Time
	Image         *string
	CreatedAt     time.Time `gorm:"autoCreateTime"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime"`
}
