package config

import (
	"fmt"
	"jakmatch-backend/models"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Jakarta",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_SSLMODE"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Gagal terhubung ke PostgreSQL: %v", err)
	}

	// Mengaktifkan ekstensi UUID bawaan PostgreSQL
	db.Exec("CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";")

	// Membuat tabel otomatis di PostgreSQL sesuai ERD
	err = db.AutoMigrate(
		&models.User{},
		&models.District{},
		&models.UserProfile{},
		&models.SavedComparison{},
	)
	if err != nil {
		log.Fatalf("Gagal migrasi tabel database: %v", err)
	}

	DB = db
	log.Println("PostgreSQL berhasil terhubung & seluruh tabel berhasil dimigrasi!")
}
