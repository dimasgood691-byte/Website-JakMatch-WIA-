package handlers

import (
	"net/http"

	"jakmatch-backend/config"
	"jakmatch-backend/models"

	"github.com/labstack/echo/v4"
)

// GET /api/v1/districts (Bisa difilter dengan ?region=Jakarta Selatan)
func GetDistricts(c echo.Context) error {
	region := c.QueryParam("region")
	var districts []models.District

	query := config.DB
	if region != "" && region != "Semua Wilayah" {
		query = query.Where("city_region = ?", region)
	}

	if err := query.Find(&districts).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"status":  "error",
			"message": "Gagal mengambil data kecamatan",
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "success",
		"data":   districts,
	})
}

// GET /api/v1/profiles
func GetUserProfiles(c echo.Context) error {
	var profiles []models.UserProfile
	if err := config.DB.Find(&profiles).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"status":  "error",
			"message": "Gagal mengambil data profil pengguna",
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "success",
		"data":   profiles,
	})
}
