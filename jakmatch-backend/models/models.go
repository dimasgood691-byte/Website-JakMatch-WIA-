package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// 1. Tabel users
type User struct {
	ID               uuid.UUID         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Email            string            `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	PasswordHash     string            `gorm:"type:varchar(255)" json:"-"`
	SessionVersion   int               `gorm:"not null;default:1" json:"-"`
	CreatedAt        time.Time         `gorm:"type:timestamp;default:current_timestamp" json:"created_at"`
	SavedComparisons []SavedComparison `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"saved_comparisons,omitempty"`
}

type PasswordResetToken struct {
	ID        uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UserID    uuid.UUID  `gorm:"type:uuid;not null;index"`
	TokenHash string     `gorm:"type:char(64);uniqueIndex;not null"`
	ExpiresAt time.Time  `gorm:"type:timestamp;not null;index"`
	UsedAt    *time.Time `gorm:"type:timestamp"`
	CreatedAt time.Time  `gorm:"type:timestamp;default:current_timestamp;index"`
}

type PasswordResetRequest struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	EmailHash string    `gorm:"type:char(64);not null;index:idx_reset_email_created,priority:1"`
	IPHash    string    `gorm:"type:char(64);not null;index:idx_reset_ip_created,priority:1"`
	CreatedAt time.Time `gorm:"type:timestamp;default:current_timestamp;index;index:idx_reset_email_created,priority:2;index:idx_reset_ip_created,priority:2"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
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
