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

	// 2. Koneksi ke PostgreSQL & Firebase Admin SDK
	config.ConnectDB()
	config.InitFirebase()

	// 3. Jalankan Seeder Data Awal
	if err := seeders.SeedDatabase(); err != nil {
		log.Fatalf("Gagal menjalankan seeder: %v", err)
	}

	// 4. Inisialisasi Echo & Middleware CORS
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:3000"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))

	// 5. Daftar Endpoint API
	api := e.Group("/api/v1")

	// Endpoint Master Data
	api.GET("/districts", handlers.GetDistricts)
	api.GET("/profiles", handlers.GetUserProfiles)

	// Endpoint Autentikasi (Register & Verifikasi Login Google)
	api.POST("/register", handlers.Register)
	api.POST("/login", handlers.Login)
	api.POST("/forgot-password", handlers.ForgotPassword)
	api.POST("/reset-password", handlers.ResetPassword)
	api.GET("/session", handlers.ValidateSession)

	// 6. Jalankan Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	e.Logger.Fatal(e.Start(":" + port))
}
