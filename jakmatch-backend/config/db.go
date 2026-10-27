package config

import (
	"fmt"
	"log"
	"os"
	"jakmatch-backend/models"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	// Memuat file .env
	err := godotenv.Load()
	if err != nil {
		log.Println("Peringatan: File .env tidak ditemukan, menggunakan variabel sistem.")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL belum diatur di .env")
	}

	// Membuka koneksi PostgreSQL
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Gagal terhubung ke database Supabase:", err)
	}

	// AutoMigrate untuk membuat tabel berdasarkan struct jika belum ada
	err = db.AutoMigrate(&models.User{}, &models.District{}, &models.UserProfile{}, &models.SavedComparison{})
	if err != nil {
		log.Fatal("Gagal melakukan migrasi database:", err)
	}

	DB = db
	fmt.Println("Berhasil terhubung ke database Supabase dan migrasi selesai!")
}