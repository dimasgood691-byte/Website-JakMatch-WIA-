package main

import (
	"log"
	"net/http"
	"os"

	"jakmatch-backend/config"
	"jakmatch-backend/handlers"
	"jakmatch-backend/seeders"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// 1. Load file .env
	if err := godotenv.Load(); err != nil {
		log.Println("File .env tidak ditemukan, menggunakan environment bawaan")
	}

	// 2. Koneksi ke PostgreSQL & Migrasi Tabel
	config.ConnectDB()

	// 3. Jalankan Seeder Data Awal
<<<<<<< HEAD
	seeders.SeedDatabase()
=======
	if err := seeders.SeedDatabase(); err != nil {
		log.Fatalf("Gagal menjalankan seeder: %v", err)
	}
>>>>>>> landingpage

	// 4. Inisialisasi Echo & Middleware CORS
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:3000"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete},
	}))

	// 5. Daftar Endpoint API
	api := e.Group("/api/v1")
	api.GET("/districts", handlers.GetDistricts)
	api.GET("/profiles", handlers.GetUserProfiles)

	// 6. Jalankan Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	e.Logger.Fatal(e.Start(":" + port))
}
