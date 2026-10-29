package handlers

import (
	"context"
	"net/http"
	"strings"

	"jakmatch-backend/config"
	"jakmatch-backend/models"

	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	IDToken  string `json:"id_token,omitempty"` // Token dari Firebase Google Auth
	Email    string `json:"email,omitempty"`    // Untuk testing via Postman saat belum ada Frontend
	Password string `json:"password,omitempty"` // Untuk testing manual via Postman
}

// 1. Endpoint Register (Email & Password)
func Register(c echo.Context) error {
	var req RegisterRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"message": "Format data tidak valid",
		})
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	if req.Email == "" || len(req.Password) < 6 {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"message": "Alamat Gmail wajib diisi dan password minimal 6 karakter",
		})
	}

	var existingUser models.User
	if err := config.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return c.JSON(http.StatusConflict, echo.Map{
			"message": "Email ini sudah terdaftar. Silakan masuk menggunakan Google.",
		})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"message": "Gagal memproses password",
		})
	}

	newUser := models.User{
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
	}

	if err := config.DB.Create(&newUser).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"message": "Gagal menyimpan akun ke database",
		})
	}

	return c.JSON(http.StatusCreated, echo.Map{
		"message": "Registrasi berhasil! Silakan masuk dengan Google menggunakan email yang sama.",
		"user":    newUser,
	})
}

// 2. Endpoint Login (Verifikasi Firebase ID Token & Fallback Postman)
func Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"message": "Format data tidak valid",
		})
	}

	var targetEmail string

	// SKENARIO A: Login Menggunakan Firebase ID Token (Production / Integrasi Google Auth)
	if req.IDToken != "" {
		if config.FirebaseAuth == nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"message": "Firebase Admin belum terkonfigurasi di server backend",
			})
		}

		// Verifikasi keaslian token ke server Firebase
		token, err := config.FirebaseAuth.VerifyIDToken(context.Background(), req.IDToken)
		if err != nil {
			return c.JSON(http.StatusUnauthorized, echo.Map{
				"message": "Token Google Firebase tidak valid atau sudah kedaluwarsa",
			})
		}

		// Ambil email resmi dari klaim token Firebase
		emailClaim, ok := token.Claims["email"].(string)
		if !ok || emailClaim == "" {
			return c.JSON(http.StatusBadRequest, echo.Map{
				"message": "Token Firebase tidak memiliki informasi email",
			})
		}
		targetEmail = strings.TrimSpace(strings.ToLower(emailClaim))

	} else {
		// SKENARIO B: Testing Backend via Postman (Tanpa Frontend)
		targetEmail = strings.TrimSpace(strings.ToLower(req.Email))
		if targetEmail == "" {
			return c.JSON(http.StatusBadRequest, echo.Map{
				"message": "Kirimkan id_token (Firebase) atau email & password untuk testing",
			})
		}
	}

	// Cek apakah email tersebut sudah pernah Registrasi di PostgreSQL
	var user models.User
	if err := config.DB.Where("email = ?", targetEmail).First(&user).Error; err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{
			"message": "Email Google ini belum terdaftar di sistem. Silakan registrasi terlebih dahulu.",
		})
	}

	// Jika testing manual dengan password via Postman, cek kecocokan password
	if req.IDToken == "" && req.Password != "" {
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
			return c.JSON(http.StatusUnauthorized, echo.Map{
				"message": "Password yang Anda masukkan salah.",
			})
		}
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message": "Berhasil masuk ke Dashboard JakMatch!",
		"user": echo.Map{
			"id":         user.ID,
			"email":      user.Email,
			"created_at": user.CreatedAt,
		},
	})
}
