package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"jakmatch-backend/config"
	"jakmatch-backend/handlers"
	"jakmatch-backend/seeders"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// 1. Load file .env (Akan dilewati otomatis saat berjalan di Railway)
	if err := godotenv.Load(); err != nil {
		log.Println("File .env tidak ditemukan, menggunakan environment bawaan server")
	}

	// 2. Koneksi ke PostgreSQL & Firebase Admin SDK
	config.ConnectDB()
	config.InitFirebase()

	// 3. Jalankan Seeder Data Awal
	if err := seeders.SeedDatabase(); err != nil {
		log.Fatalf("Gagal menjalankan seeder: %v", err)
	}

	// 4. Inisialisasi Echo & Middleware CORS Dinamis (Lokal + Produksi Vercel)
	e := echo.New()
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	allowedOrigins := []string{"http://localhost:3000"}
	if frontendURL := os.Getenv("FRONTEND_URL"); frontendURL != "" {
		// Mendukung satu atau beberapa URL Vercel (dipisahkan koma jika lebih dari satu)
		for _, origin := range strings.Split(frontendURL, ",") {
			cleanOrigin := strings.TrimRight(strings.TrimSpace(origin), "/")
			if cleanOrigin != "" {
				allowedOrigins = append(allowedOrigins, cleanOrigin)
			}
		}
	}

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: allowedOrigins,
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))

	// Endpoint Health Check (Untuk memastikan server Railway aktif)
	e.GET("/", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"status":  "online",
			"service": "JakMatch Backend API",
		})
	})

	// 5. Daftar Endpoint API
	api := e.Group("/api/v1")

	// Endpoint Master Data & Riwayat Analisis
	api.GET("/districts", handlers.GetDistricts)
	api.POST("/districts/sync-bps", handlers.SyncDistrictsFromBPS)
	api.GET("/profiles", handlers.GetUserProfiles)
	api.POST("/comparisons", handlers.CreateSavedComparison)
	api.GET("/comparisons", handlers.GetSavedComparisons)
	api.DELETE("/comparisons/:id", handlers.DeleteSavedComparison)

	// Endpoint Autentikasi & Manajemen Sesi
	api.POST("/register", handlers.Register)
	api.POST("/login", handlers.Login)
	api.POST("/logout", handlers.Logout)
	api.POST("/forgot-password", handlers.ForgotPassword)
	api.POST("/reset-password", handlers.ResetPassword)
	api.GET("/session", handlers.ValidateSession)

	// 6. Jalankan Server (Railway otomatis mengisi variabel PORT)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	e.Logger.Fatal(e.Start("0.0.0.0:" + port))
}
