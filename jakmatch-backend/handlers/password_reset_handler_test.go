package handlers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestForgotPasswordReportsMissingSMTPConfiguration(t *testing.T) {
	t.Setenv("SMTP_HOST", "smtp.gmail.com")
	t.Setenv("SMTP_PORT", "465")
	t.Setenv("SMTP_USERNAME", "sender@gmail.com")
	t.Setenv("SMTP_PASSWORD", "")
	t.Setenv("SMTP_FROM", "JakMatch <sender@gmail.com>")
	t.Setenv("APP_BASE_URL", "http://localhost:3000")

	request := httptest.NewRequest(
		http.MethodPost,
		"/api/v1/forgot-password",
		strings.NewReader(`{"email":"user@gmail.com"}`),
	)
	request.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	response := httptest.NewRecorder()
	context := echo.New().NewContext(request, response)

	if err := ForgotPassword(context); err != nil {
		t.Fatalf("ForgotPassword returned an error: %v", err)
	}
	if response.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected status %d, got %d", http.StatusServiceUnavailable, response.Code)
	}
}
