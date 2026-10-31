package handlers

import (
	"errors"
	"log"
	"net/http"
	"strings"

	"jakmatch-backend/config"
	"jakmatch-backend/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

var (
	errInvalidSession = errors.New("invalid session token")
)

// authenticateUserFromHeader mengekstrak dan memvalidasi Bearer JWT terhadap database.
func authenticateUserFromHeader(c echo.Context) (*models.User, error) {
	authorization := c.Request().Header.Get(echo.HeaderAuthorization)
	if !strings.HasPrefix(authorization, "Bearer ") {
		return nil, errInvalidSession
	}

	rawToken := strings.TrimSpace(strings.TrimPrefix(authorization, "Bearer "))
	if rawToken == "" || len(rawToken) > 8192 {
		return nil, errInvalidSession
	}

	secret, err := jwtSigningSecret()
	if err != nil {
		return nil, err
	}

	claims := new(authClaims)
	token, err := jwt.ParseWithClaims(
		rawToken,
		claims,
		func(token *jwt.Token) (interface{}, error) {
			return secret, nil
		},
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithIssuer(jwtIssuer),
		jwt.WithExpirationRequired(),
		jwt.WithIssuedAt(),
	)
	if err != nil || token == nil || !token.Valid ||
		claims.UserID == "" || claims.Subject != claims.UserID ||
		claims.Email == "" || claims.SessionVersion < 1 {
		return nil, errInvalidSession
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return nil, errInvalidSession
	}

	var user models.User
	err = config.DB.Select("id", "email", "session_version").
		Where("id = ?", userID).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errInvalidSession
	}
	if err != nil {
		return nil, err
	}

	if claims.SessionVersion != user.SessionVersion || claims.Email != user.Email {
		return nil, errInvalidSession
	}

	return &user, nil
}

// ValidateSession (GET /api/v1/session) memverifikasi keaktifan sesi pengguna.
func ValidateSession(c echo.Context) error {
	c.Response().Header().Set(echo.HeaderCacheControl, "no-store")

	user, err := authenticateUserFromHeader(c)
	if errors.Is(err, errInvalidSession) {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "Sesi tidak valid atau telah berakhir"})
	}
	if err != nil {
		log.Printf("Session validation error: %v", err)
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "Sesi tidak dapat diverifikasi"})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"user": echo.Map{
			"id":    user.ID,
			"email": user.Email,
		},
	})
}

// Logout (POST /api/v1/logout) mencabut sesi aktif dengan menaikkan session_version di database.
func Logout(c echo.Context) error {
	c.Response().Header().Set(echo.HeaderCacheControl, "no-store")

	user, err := authenticateUserFromHeader(c)
	if err != nil {
		// Tetap kembalikan 200 OK agar proses pembersihan sesi di sisi client berjalan mulus
		return c.JSON(http.StatusOK, echo.Map{"message": "Sesi telah diakhiri"})
	}

	if err := config.DB.Model(&models.User{}).
		Where("id = ?", user.ID).
		Update("session_version", gorm.Expr("session_version + 1")).Error; err != nil {
		log.Printf("Logout session revocation error: %v", err)
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "Gagal mencabut sesi di server"})
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "Berhasil keluar dari sesi JakMatch"})
}
