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

func ValidateSession(c echo.Context) error {
	c.Response().Header().Set(echo.HeaderCacheControl, "no-store")
	authorization := c.Request().Header.Get(echo.HeaderAuthorization)
	if !strings.HasPrefix(authorization, "Bearer ") {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "Sesi tidak valid"})
	}
	rawToken := strings.TrimSpace(strings.TrimPrefix(authorization, "Bearer "))
	if rawToken == "" || len(rawToken) > 8192 {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "Sesi tidak valid"})
	}

	secret, err := jwtSigningSecret()
	if err != nil {
		log.Printf("Session validation configuration error: %v", err)
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "Sesi tidak dapat diverifikasi"})
	}

	claims := new(authClaims)
	token, err := jwt.ParseWithClaims(
		rawToken,
		claims,
		func(token *jwt.Token) (interface{}, error) {
			return secret, nil
		},
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithIssuer("jakmatch-api"),
		jwt.WithExpirationRequired(),
		jwt.WithIssuedAt(),
	)
	if err != nil || token == nil || !token.Valid ||
		claims.UserID == "" || claims.Subject != claims.UserID ||
		claims.Email == "" || claims.SessionVersion < 1 {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "Sesi tidak valid"})
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "Sesi tidak valid"})
	}

	var user models.User
	err = config.DB.Select("id", "email", "session_version").
		Where("id = ?", userID).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "Sesi tidak valid"})
	}
	if err != nil {
		log.Printf("Session validation database error: %v", err)
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "Sesi tidak dapat diverifikasi"})
	}
	if claims.SessionVersion != user.SessionVersion || claims.Email != user.Email {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "Sesi tidak valid"})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"user": echo.Map{
			"id":    user.ID,
			"email": user.Email,
		},
	})
}
