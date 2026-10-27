package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// 1. Tabel users
type User struct {
	ID               uuid.UUID         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Email            string            `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	CreatedAt        time.Time         `gorm:"type:timestamp;default:current_timestamp" json:"created_at"`
	SavedComparisons []SavedComparison `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"saved_comparisons,omitempty"`
}

// 2. Tabel districts (Master Data - Public-Read)
type District struct {
	ID                 uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	DistrictName       string  `gorm:"type:varchar(100);not null" json:"district_name"`
	CityRegion         string  `gorm:"type:varchar(100);not null" json:"city_region"`
	TierZone           int     `gorm:"type:int;not null" json:"tier_zone"`
	TransportScore     float64 `gorm:"type:float;not null" json:"transport_score"`
	EnvironmentScore   float64 `gorm:"type:float;not null" json:"environment_score"`
	FloodFreeScore     float64 `gorm:"type:float;not null" json:"flood_free_score"`
	HealthScore        float64 `gorm:"type:float;not null" json:"health_score"`
	MarketDensityScore float64 `gorm:"type:float;not null" json:"market_density_score"`
	BaseRentalCost     int     `gorm:"type:int;not null" json:"base_rental_cost"`
}

// 3. Tabel user_profiles
type UserProfile struct {
	ID           uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	ProfileKey   string `gorm:"type:varchar(50);uniqueIndex;not null" json:"profile_key"`
	ProfileLabel string `gorm:"type:varchar(100);not null" json:"profile_label"`
	PropertyType string `gorm:"type:varchar(100);not null" json:"property_type"`
}

// 4. Tabel saved_comparisons
type SavedComparison struct {
	ID                 uuid.UUID       `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID             uuid.UUID       `gorm:"type:uuid;not null;index" json:"user_id"`
	SelectedRegion     string          `gorm:"type:varchar(100);not null" json:"selected_region"`
	UserBudget         int             `gorm:"type:int;not null" json:"user_budget"`
	SelectedProfile    string          `gorm:"type:varchar(50);not null" json:"selected_profile"`
	TopDistrictsResult json.RawMessage `gorm:"type:jsonb;not null" json:"top_districts_result"`
	AiSummaryText      string          `gorm:"type:text" json:"ai_summary_text"`
	CreatedAt          time.Time       `gorm:"type:timestamp;default:current_timestamp" json:"created_at"`
	User               User            `gorm:"foreignKey:UserID;references:ID" json:"-"`
}
