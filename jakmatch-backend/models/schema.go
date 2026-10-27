package models

import (
	"time"
	"github.com/google/uuid"
)

// Tabel users (Data Pengguna & Autentikasi)[cite: 3]
type User struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Email     string    `gorm:"type:varchar;unique;not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

// Tabel districts (Data Master Kecamatan)[cite: 3]
type District struct {
	ID                 uint    `gorm:"primaryKey"`
	DistrictName       string  `gorm:"type:varchar;not null"`
	CityRegion         string  `gorm:"type:varchar;not null"`
	TierZone           int     `gorm:"not null"`
	TransportScore     float64
	EnvironmentScore   float64
	FloodFreeScore     float64
	HealthScore        float64
	MarketDensityScore float64
	BaseRentalCost     int
}

// Tabel user_profiles (Konteks Aset & Preferensi)[cite: 3]
type UserProfile struct {
	ID           uint   `gorm:"primaryKey"`
	ProfileKey   string `gorm:"type:varchar"`
	ProfileLabel string `gorm:"type:varchar"`
	PropertyType string `gorm:"type:varchar"`
}

// Tabel saved_comparisons (Riwayat Riset) dengan Relasi ke users[cite: 3]
type SavedComparison struct {
	ID                 uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID             uuid.UUID `gorm:"type:uuid;not null"`
	SelectedRegion     string    `gorm:"type:varchar"`
	UserBudget         int
	SelectedProfile    string    `gorm:"type:varchar"`
	TopDistrictsResult string    `gorm:"type:jsonb"` // GORM memetakan tipe ini ke JSONB di PostgreSQL[cite: 3]
	AISummaryText      string    `gorm:"type:text"`
	CreatedAt          time.Time `gorm:"autoCreateTime"`
	User               User      `gorm:"foreignKey:UserID"` // Foreign Key FK_users.id[cite: 3]
}