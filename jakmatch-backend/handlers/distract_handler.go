package handlers

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"os"
	"strings"
	"time"

	"jakmatch-backend/config"
	"jakmatch-backend/models"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// Struktur untuk membaca daftar variabel aktif dari Web API BPS
type BPSResponse struct {
	Status           string             `json:"status"`
	DataAvailability string             `json:"data-availability"`
	Vervar           []BPSVervar        `json:"vervar"`
	DataContent      map[string]float64 `json:"datacontent"`
}

type BPSVervar struct {
	Val   int    `json:"val"`
	Label string `json:"label"`
}

type BPSVarListResponse struct {
	Status           string            `json:"status"`
	DataAvailability string            `json:"data-availability"`
	Message          string            `json:"message"`
	Data             []json.RawMessage `json:"data"`
}

type BPSVarItem struct {
	VarID int    `json:"var_id"`
	Title string `json:"title"`
}

// POST /api/v1/districts/sync-bps
func SyncDistrictsFromBPS(c echo.Context) error {
	apiKey := strings.TrimSpace(os.Getenv("BPS_API_KEY"))
	domain := strings.TrimSpace(os.Getenv("BPS_DOMAIN_ID"))
	if domain == "" {
		domain = "3100" // Provinsi DKI Jakarta
	}

	if apiKey == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"status":  "error",
			"message": "BPS_API_KEY belum dipasang di file .env",
		})
	}

	client := &http.Client{Timeout: 15 * time.Second}
	varID := c.QueryParam("var_id")
	varTitle := "Indikator Wilayah BPS DKI Jakarta"

	// 1. Ambil daftar variabel resmi BPS DKI Jakarta untuk memvalidasi API Key & mencari var_id aktif
	varListURL := fmt.Sprintf("https://webapi.bps.go.id/v1/api/list/model/var/domain/%s/key/%s/", domain, apiKey)
	listResp, err := client.Get(varListURL)
	if err != nil {
		return c.JSON(http.StatusBadGateway, map[string]string{
			"status":  "error",
			"message": "Gagal menghubungi server Web API BPS DKI Jakarta",
		})
	}
	defer listResp.Body.Close()

	var varListData BPSVarListResponse
	if err := json.NewDecoder(listResp.Body).Decode(&varListData); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"status":  "error",
			"message": "Gagal membaca respons daftar variabel dari API BPS",
		})
	}

	if varListData.Status != "OK" {
		return c.JSON(http.StatusUnauthorized, map[string]interface{}{
			"status":  "error",
			"message": "BPS_API_KEY tidak valid atau belum aktif di webapi.bps.go.id",
			"bps_raw": varListData,
		})
	}

	// Ekstrak var_id pertama yang tersedia jika user tidak memasukkan var_id yang valid
	var availableVars []BPSVarItem
	if len(varListData.Data) > 1 {
		_ = json.Unmarshal(varListData.Data[1], &availableVars)
	}

	if varID == "" && len(availableVars) > 0 {
		varID = fmt.Sprintf("%d", availableVars[0].VarID)
		varTitle = availableVars[0].Title
	}

	// 2. Request data statistik ke endpoint model/data BPS
	dataURL := fmt.Sprintf("https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/%s/var/%s/key/%s/", domain, varID, apiKey)
	resp, err := client.Get(dataURL)
	if err != nil {
		return c.JSON(http.StatusBadGateway, map[string]string{
			"status":  "error",
			"message": "Gagal mengambil data tabel dari server BPS",
		})
	}
	defer resp.Body.Close()

	var bpsData BPSResponse
	if err := json.NewDecoder(resp.Body).Decode(&bpsData); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"status":  "error",
			"message": "Gagal membaca format JSON data dari API BPS",
		})
	}

	// Jika var_id yang dimasukkan (misal 125) kosong di BPS, otomatis gunakan var_id aktif pertama dari BPS
	if (bpsData.Status != "OK" || bpsData.DataAvailability != "available") && len(availableVars) > 0 {
		varID = fmt.Sprintf("%d", availableVars[0].VarID)
		varTitle = availableVars[0].Title
		fallbackURL := fmt.Sprintf("https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/%s/var/%s/key/%s/", domain, varID, apiKey)
		if fallbackResp, err := client.Get(fallbackURL); err == nil {
			defer fallbackResp.Body.Close()
			_ = json.NewDecoder(fallbackResp.Body).Decode(&bpsData)
		}
	}

	updatedCount := 0

	// 3. Petakan nilai dari datacontent BPS ke kecamatan / wilayah kota di PostgreSQL
	for _, item := range bpsData.Vervar {
		cleanLabel := strings.ToLower(strings.TrimSpace(item.Label))

		var rawValue float64
		for key, val := range bpsData.DataContent {
			if strings.HasPrefix(key, fmt.Sprintf("%d", item.Val)) && val > 0 {
				rawValue = val
				break
			}
		}

		if rawValue > 0 {
			normalizedScore := math.Min(99.0, math.Max(65.0, 65.0+math.Log10(rawValue)*8.0))
			normalizedScore = math.Round(normalizedScore*10) / 10

			// Cocokkan baik dengan nama kecamatan maupun nama Kota Administrasi (Jakarta Selatan, dll.)
			result := config.DB.Model(&models.District{}).
				Where("LOWER(district_name) LIKE ? OR LOWER(city_region) LIKE ?", "%"+cleanLabel+"%", "%"+cleanLabel+"%").
				Update("market_density_score", normalizedScore)

			updatedCount += int(result.RowsAffected)
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":          "success",
		"message":         "Berhasil terhubung & sinkronisasi dengan Web API BPS DKI Jakarta",
		"domain":          domain,
		"variable_id":     varID,
		"variable_title":  varTitle,
		"updated_records": updatedCount,
	})
}

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

type SaveComparisonRequest struct {
	UserID             string          `json:"user_id"`
	SelectedRegion     string          `json:"selected_region"`
	UserBudget         int             `json:"user_budget"`
	SelectedProfile    string          `json:"selected_profile"`
	TopDistrictsResult json.RawMessage `json:"top_districts_result"`
	AiSummaryText      string          `json:"ai_summary_text"`
}

// POST /api/v1/comparisons (Menyimpan hasil analisis ke tabel saved_comparisons)
func CreateSavedComparison(c echo.Context) error {
	var req SaveComparisonRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"status":  "error",
			"message": "Format request tidak valid",
		})
	}

	parsedUserID, err := uuid.Parse(req.UserID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"status":  "error",
			"message": "ID pengguna (UUID) tidak valid",
		})
	}

	comparison := models.SavedComparison{
		UserID:             parsedUserID,
		SelectedRegion:     req.SelectedRegion,
		UserBudget:         req.UserBudget,
		SelectedProfile:    req.SelectedProfile,
		TopDistrictsResult: req.TopDistrictsResult,
		AiSummaryText:      req.AiSummaryText,
	}

	if err := config.DB.Create(&comparison).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"status":  "error",
			"message": "Gagal menyimpan riwayat perbandingan wilayah",
		})
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"status":  "success",
		"message": "Riwayat analisis berhasil disimpan",
		"data":    comparison,
	})
}

// GET /api/v1/comparisons?user_id=xxxx (Mengambil daftar riwayat perbandingan milik user)
func GetSavedComparisons(c echo.Context) error {
	userID := c.QueryParam("user_id")
	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"status":  "error",
			"message": "Parameter user_id (UUID) wajib diisi dengan benar",
		})
	}

	var comparisons []models.SavedComparison
	if err := config.DB.Where("user_id = ?", parsedUserID).Order("created_at DESC").Find(&comparisons).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"status":  "error",
			"message": "Gagal mengambil riwayat perbandingan",
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "success",
		"data":   comparisons,
	})
}

// DELETE /api/v1/comparisons/:id (Menghapus salah satu riwayat perbandingan)
func DeleteSavedComparison(c echo.Context) error {
	idParam := c.Param("id")
	parsedID, err := uuid.Parse(idParam)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"status":  "error",
			"message": "ID riwayat tidak valid",
		})
	}

	if err := config.DB.Delete(&models.SavedComparison{}, "id = ?", parsedID).Error; err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"status":  "error",
			"message": "Gagal menghapus riwayat perbandingan",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{
		"status":  "success",
		"message": "Riwayat perbandingan berhasil dihapus",
	})
}