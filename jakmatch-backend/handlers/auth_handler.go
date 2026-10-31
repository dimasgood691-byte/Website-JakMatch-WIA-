package handlers

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"time"
	"unicode/utf8"

	"jakmatch-backend/config"
	"jakmatch-backend/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const (
	jwtIssuer          = "jakmatch-api"
	sessionDuration    = 48 * time.Hour
	minPasswordChars   = 12
	maxPasswordBytes   = 72
	minJWTSecretLength = 32
)

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	IDToken  string `json:"id_token,omitempty"` // Token dari Firebase Google Auth
	Email    string `json:"email,omitempty"`    // Login via Email & Password
	Password string `json:"password,omitempty"` // Password akun JakMatch
}

type authClaims struct {
	UserID         string `json:"user_id"`
	Email          string `json:"email"`
	SessionVersion int    `json:"session_version"`
	jwt.RegisteredClaims
}

// jwtSigningSecret mengambil dan memvalidasi kunci rahasia JWT dari environment variable.
func jwtSigningSecret() ([]byte, error) {
	secret := os.Getenv("JWT_SECRET")
	if len(secret) < minJWTSecretLength {
		return nil, errors.New("JWT_SECRET must contain at least 32 characters")
	}
	return []byte(secret), nil
}

// isValidPassword memastikan panjang password antara 12 karakter hingga 72 byte (batas aman bcrypt).
func isValidPassword(password string) bool {
	charCount := utf8.RuneCountInString(password)
	byteLen := len(password)
	return charCount >= minPasswordChars && byteLen <= maxPasswordBytes
}

// generateToken menerbitkan JWT HS256 dengan masa berlaku 48 jam.
func generateToken(userID string, email string, sessionVersion int) (string, int64, error) {
	secret, err := jwtSigningSecret()
	if err != nil {
		return "", 0, err
	}

	now := time.Now()
	expires := now.Add(sessionDuration)
	claims := authClaims{
		UserID:         userID,
		Email:          email,
		SessionVersion: sessionVersion,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			Issuer:    jwtIssuer,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expires),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString(secret)
	return signedToken, expires.Unix(), err
}

// buildAuthResponse menyusun payload JSON standar untuk Register dan Login.
func buildAuthResponse(message string, token string, expiresAt int64, user models.User) echo.Map {
	return echo.Map{
		"message":    message,
		"token":      token,
		"expires_at": expiresAt,
		"user": echo.Map{
			"id":         user.ID,
			"email":      user.Email,
			"created_at": user.CreatedAt,
		},
	}
}

// 1. Endpoint Register (POST /api/v1/register)
func Register(c echo.Context) error {
	c.Response().Header().Set(echo.HeaderCacheControl, "no-store")

	var req RegisterRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"message": "Format data tidak valid",
		})
	}

	email, validEmail := normalizeEmail(req.Email)
	if !validEmail || !isValidPassword(req.Password) {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"message": "Alamat email wajib valid dan password harus minimal 12 karakter (maksimal 72 byte)",
		})
	}

	if _, err := jwtSigningSecret(); err != nil {
		log.Printf("Registration session configuration error: %v", err)
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"message": "Konfigurasi keamanan sesi belum tersedia",
		})
	}

	var existingUser models.User
	if err := config.DB.Where("email = ?", email).First(&existingUser).Error; err == nil {
		return c.JSON(http.StatusConflict, echo.Map{
			"message": "Email ini sudah terdaftar. Silakan masuk melalui halaman Login.",
		})
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Printf("Register account lookup error: %v", err)
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"message": "Gagal memeriksa ketersediaan email",
		})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"message": "Gagal memproses password",
		})
	}

	newUser := models.User{
		Email:          email,
		PasswordHash:   string(hashedPassword),
		SessionVersion: 1,
	}

	if err := config.DB.Create(&newUser).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"message": "Gagal menyimpan akun ke database",
		})
	}

	token, expiresAt, err := generateToken(newUser.ID.String(), newUser.Email, newUser.SessionVersion)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"message": "Gagal membuat sesi login",
		})
	}

	return c.JSON(
		http.StatusCreated,
		buildAuthResponse(
			"Registrasi berhasil! Selamat datang di JakMatch.",
			token,
			expiresAt,
			newUser,
		),
	)
}

// 2. Endpoint Login (POST /api/v1/login — Mendukung Firebase Google ID Token & Email/Password)
func Login(c echo.Context) error {
	c.Response().Header().Set(echo.HeaderCacheControl, "no-store")

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
		normalized, valid := normalizeEmail(emailClaim)
		if !ok || !valid {
			return c.JSON(http.StatusBadRequest, echo.Map{
				"message": "Token Google tidak memiliki informasi email yang valid",
			})
		}
		targetEmail = normalized
	} else {
		// Skenario B: Login via Email & Password
		normalized, valid := normalizeEmail(req.Email)
		if !valid || req.Password == "" {
			return c.JSON(http.StatusBadRequest, echo.Map{
				"message": "Alamat email dan password wajib diisi dengan benar",
			})
		}
		targetEmail = normalized
	}

	var user models.User
	if err := config.DB.Where("email = ?", targetEmail).First(&user).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		return c.JSON(http.StatusNotFound, echo.Map{
			"message": "Akun JakMatch untuk email ini belum terdaftar. Silakan registrasi terlebih dahulu.",
		})
	} else if err != nil {
		log.Printf("Login account lookup error: %v", err)
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"message": "Gagal memeriksa akun. Silakan coba kembali nanti.",
		})
	}

	if req.IDToken == "" {
		if user.PasswordHash == "" {
			return c.JSON(http.StatusUnauthorized, echo.Map{
				"message": "Akun ini terdaftar menggunakan metode lain. Silakan masuk dengan Google atau atur ulang password.",
			})
		}
		if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
			return c.JSON(http.StatusUnauthorized, echo.Map{
				"message": "Password yang Anda masukkan salah.",
			})
		}
	}

	token, expiresAt, err := generateToken(user.ID.String(), user.Email, user.SessionVersion)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"message": "Gagal membuat sesi login",
		})
	}

	return c.JSON(
		http.StatusOK,
		buildAuthResponse(
			"Berhasil masuk ke Dashboard JakMatch!",
			token,
			expiresAt,
			user,
		),
	)
}
