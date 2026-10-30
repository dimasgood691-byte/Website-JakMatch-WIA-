package handlers

import (
	"context"
	"errors"
	"net/http"
	"os"
	"strings"
	"time"
	"unicode/utf8"

	"jakmatch-backend/config"
	"jakmatch-backend/models"

	"github.com/golang-jwt/jwt/v5"
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

type authClaims struct {
	UserID         string `json:"user_id"`
	Email          string `json:"email"`
	SessionVersion int    `json:"session_version"`
	jwt.RegisteredClaims
}

func jwtSigningSecret() ([]byte, error) {
	secret := os.Getenv("JWT_SECRET")
	if len(secret) < 32 {
		return nil, errors.New("JWT_SECRET must contain at least 32 characters")
	}
	return []byte(secret), nil
}

func generateToken(userID string, email string, sessionVersion int) (string, int64, error) {
	secret, err := jwtSigningSecret()
	if err != nil {
		return "", 0, err
	}

	now := time.Now()
	expires := now.Add(48 * time.Hour)
	claims := authClaims{
		UserID:         userID,
		Email:          email,
		SessionVersion: sessionVersion,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			Issuer:    "jakmatch-api",
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expires),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString(secret)
	return signedToken, expires.Unix(), err
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

	if req.Email == "" || utf8.RuneCountInString(req.Password) < 12 || len(req.Password) > 72 {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"message": "Alamat Gmail wajib diisi dan password harus minimal 12 karakter (maksimal 72 byte)",
		})
	}

	var existingUser models.User
	if err := config.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return c.JSON(http.StatusConflict, echo.Map{
			"message": "Email ini sudah terdaftar. Silakan masuk menggunakan Google.",
		})
	}

	if _, err := jwtSigningSecret(); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"message": "Konfigurasi keamanan sesi belum tersedia",
		})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"message": "Gagal memproses password",
		})
	}

	newUser := models.User{
		Email:          req.Email,
		PasswordHash:   string(hashedPassword),
		SessionVersion: 1,
	}

	if err := config.DB.Create(&newUser).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"message": "Gagal menyimpan akun ke database",
		})
	}

	//buat token sesi 48 jam dan agar user langsung masuk ke dashboard
	token, expiresAt, err := generateToken(newUser.ID.String(), newUser.Email, newUser.SessionVersion)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"message": "Gagal membuat sesi login",
		})
	}

	return c.JSON(http.StatusCreated, echo.Map{
		"message":    "Registrasi berhasil! Silakan masuk dengan Google menggunakan email yang sama.",
		"token":      token,
		"expires_at": expiresAt,
		"user": echo.Map{
			"id":         newUser.ID,
			"email":      newUser.Email,
			"created_at": newUser.CreatedAt,
		},
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

	// Skenario A: Login via Tombol Google (Firebase ID Token)
	if req.IDToken != "" {
		if config.FirebaseAuth == nil {
			return c.JSON(http.StatusInternalServerError, echo.Map{
				"message": "Firebase Admin belum terkonfigurasi di server backend",
			})
		}

		verifiedToken, err := config.FirebaseAuth.VerifyIDToken(context.Background(), req.IDToken)
		if err != nil {
			return c.JSON(http.StatusUnauthorized, echo.Map{
				"message": "Token Google tidak valid atau sudah kedaluwarsa",
			})
		}

		emailClaim, ok := verifiedToken.Claims["email"].(string)
		if !ok || emailClaim == "" {
			return c.JSON(http.StatusBadRequest, echo.Map{
				"message": "Token Google tidak memiliki informasi email",
			})
		}
		targetEmail = strings.TrimSpace(strings.ToLower(emailClaim))
	} else {
		// Skenario B: Login via Email & Password
		targetEmail = strings.TrimSpace(strings.ToLower(req.Email))
		if targetEmail == "" || req.Password == "" {
			return c.JSON(http.StatusBadRequest, echo.Map{
				"message": "Alamat Gmail dan password wajib diisi",
			})
		}
	}

	var user models.User
	if err := config.DB.Where("email = ?", targetEmail).First(&user).Error; err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{
			"message": "Email Google ini belum terdaftar di sistem. Silakan registrasi terlebih dahulu.",
		})
	}

	if req.IDToken == "" {
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
			return c.JSON(http.StatusUnauthorized, echo.Map{
				"message": "Password yang Anda masukkan salah.",
			})
		}
	}

	// Buat token sesi 48 jam baru
	token, expiresAt, err := generateToken(user.ID.String(), user.Email, user.SessionVersion)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"message": "Gagal membuat sesi login",
		})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"message":    "Berhasil masuk ke Dashboard JakMatch!",
		"token":      token,
		"expires_at": expiresAt,
		"user": echo.Map{
			"id":         user.ID,
			"email":      user.Email,
			"created_at": user.CreatedAt,
		},
	})
}
