package handlers

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/tls"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"net/mail"
	"net/smtp"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"jakmatch-backend/config"
	"jakmatch-backend/models"

	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const resetResponse = "Jika alamat email terdaftar, tautan untuk mengatur ulang password akan dikirim."

type forgotPasswordRequest struct {
	Email string `json:"email"`
}

type resetPasswordRequest struct {
	Token    string `json:"token"`
	Password string `json:"password"`
}

type smtpSettings struct {
	host     string
	port     int
	username string
	password string
	from     *mail.Address
}

func normalizeEmail(value string) (string, bool) {
	value = strings.ToLower(strings.TrimSpace(value))
	address, err := mail.ParseAddress(value)
	if err != nil || address.Address != value || len(value) > 254 {
		return "", false
	}
	return value, true
}

func keyedDigest(secret []byte, value string) string {
	mac := hmacSHA256(secret, []byte(value))
	return hex.EncodeToString(mac)
}

func hmacSHA256(key, value []byte) []byte {
	mac := hmac.New(sha256.New, key)
	_, _ = mac.Write(value)
	return mac.Sum(nil)
}

func newResetToken() (string, string, error) {
	random := make([]byte, 32)
	if _, err := rand.Read(random); err != nil {
		return "", "", err
	}
	token := base64.RawURLEncoding.EncodeToString(random)
	hash := sha256.Sum256([]byte(token))
	return token, hex.EncodeToString(hash[:]), nil
}

func recordResetRequest(emailHash, ipHash string, now time.Time) (bool, error) {
	returnValue := false
	err := config.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec("SELECT pg_advisory_xact_lock(hashtext(?), hashtext(?))", "reset-email", emailHash).Error; err != nil {
			return err
		}
		if err := tx.Exec("SELECT pg_advisory_xact_lock(hashtext(?), hashtext(?))", "reset-ip", ipHash).Error; err != nil {
			return err
		}

		var emailCount, ipCount int64
		since := now.Add(-time.Hour)
		if err := tx.Model(&models.PasswordResetRequest{}).
			Where("email_hash = ? AND created_at >= ?", emailHash, since).
			Count(&emailCount).Error; err != nil {
			return err
		}
		if err := tx.Model(&models.PasswordResetRequest{}).
			Where("ip_hash = ? AND created_at >= ?", ipHash, since).
			Count(&ipCount).Error; err != nil {
			return err
		}
		if err := tx.Create(&models.PasswordResetRequest{
			EmailHash: emailHash,
			IPHash:    ipHash,
			CreatedAt: now,
		}).Error; err != nil {
			return err
		}
		returnValue = emailCount < 3 && ipCount < 10
		return tx.Where("created_at < ?", now.Add(-24*time.Hour)).
			Delete(&models.PasswordResetRequest{}).Error
	})
	return returnValue, err
}

func resetURL(token string) (string, error) {
	base := strings.TrimRight(os.Getenv("APP_BASE_URL"), "/")
	parsed, err := url.Parse(base)
	if err != nil || parsed.Host == "" || parsed.User != nil ||
		parsed.RawQuery != "" || parsed.Fragment != "" {
		return "", errors.New("APP_BASE_URL must be an absolute application URL")
	}
	if parsed.Scheme != "https" && !(parsed.Scheme == "http" && (parsed.Hostname() == "localhost" || parsed.Hostname() == "127.0.0.1")) {
		return "", errors.New("APP_BASE_URL must use HTTPS outside localhost")
	}
	parsed.Path = strings.TrimRight(parsed.Path, "/") + "/reset-password"
	query := parsed.Query()
	query.Set("token", token)
	parsed.RawQuery = query.Encode()
	return parsed.String(), nil
}

func loadSMTPSettings() (smtpSettings, error) {
	settings := smtpSettings{
		host:     strings.TrimSpace(os.Getenv("SMTP_HOST")),
		username: os.Getenv("SMTP_USERNAME"),
		password: os.Getenv("SMTP_PASSWORD"),
	}
	port := strings.TrimSpace(os.Getenv("SMTP_PORT"))
	from, err := mail.ParseAddress(os.Getenv("SMTP_FROM"))
	if settings.host == "" || port == "" || settings.username == "" ||
		settings.password == "" || err != nil {
		return smtpSettings{}, errors.New("SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, and valid SMTP_FROM are required")
	}
	settings.port, err = strconv.Atoi(port)
	if err != nil || settings.port != 465 {
		return smtpSettings{}, errors.New("SMTP_PORT must be 465 (implicit TLS)")
	}
	settings.from = from
	return settings, nil
}

func sendResetEmail(settings smtpSettings, recipient, link string) error {
	conn, err := tls.DialWithDialer(&net.Dialer{Timeout: 10 * time.Second}, "tcp",
		net.JoinHostPort(settings.host, strconv.Itoa(settings.port)), &tls.Config{
			MinVersion: tls.VersionTLS12,
			ServerName: settings.host,
		})
	if err != nil {
		return fmt.Errorf("connect to SMTP server: %w", err)
	}
	if err := conn.SetDeadline(time.Now().Add(20 * time.Second)); err != nil {
		_ = conn.Close()
		return fmt.Errorf("set SMTP deadline: %w", err)
	}
	client, err := smtp.NewClient(conn, settings.host)
	if err != nil {
		_ = conn.Close()
		return fmt.Errorf("initialize SMTP client: %w", err)
	}
	defer client.Close()

	auth := plainSMTPAuth{username: settings.username, password: settings.password, host: settings.host}
	if err := client.Auth(auth); err != nil {
		return fmt.Errorf("authenticate SMTP client: %w", err)
	}
	if err := client.Mail(settings.from.Address); err != nil {
		return fmt.Errorf("set SMTP sender: %w", err)
	}
	if err := client.Rcpt(recipient); err != nil {
		return fmt.Errorf("set SMTP recipient: %w", err)
	}
	writer, err := client.Data()
	if err != nil {
		return fmt.Errorf("open SMTP message: %w", err)
	}
	message := fmt.Sprintf(
		"From: %s\r\nTo: %s\r\nSubject: JakMatch password reset\r\n"+
			"Content-Type: text/plain; charset=UTF-8\r\n\r\n"+
			"Gunakan tautan berikut untuk mengatur ulang password JakMatch. "+
			"Tautan hanya dapat digunakan sekali dan berlaku selama 15 menit.\r\n\r\n%s\r\n\r\n"+
			"Jika Anda tidak meminta reset password, abaikan email ini.\r\n",
		settings.from.String(), recipient, link,
	)
	if _, err := writer.Write([]byte(message)); err != nil {
		_ = writer.Close()
		return fmt.Errorf("write SMTP message: %w", err)
	}
	if err := writer.Close(); err != nil {
		return fmt.Errorf("send SMTP message: %w", err)
	}
	if err := client.Quit(); err != nil {
		return fmt.Errorf("close SMTP session: %w", err)
	}
	return nil
}

type plainSMTPAuth struct {
	username string
	password string
	host     string
}

func (a plainSMTPAuth) Start(server *smtp.ServerInfo) (string, []byte, error) {
	if server.Name != a.host {
		return "", nil, errors.New("SMTP server hostname does not match configured host")
	}
	return "PLAIN", []byte("\x00" + a.username + "\x00" + a.password), nil
}

func (plainSMTPAuth) Next(fromServer []byte, more bool) ([]byte, error) {
	if more {
		return nil, errors.New("unexpected SMTP authentication challenge")
	}
	return nil, nil
}

func ForgotPassword(c echo.Context) error {
	c.Response().Header().Set(echo.HeaderCacheControl, "no-store")
	var req forgotPasswordRequest
	c.Request().Body = http.MaxBytesReader(c.Response(), c.Request().Body, 4096)
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "Format data tidak valid"})
	}
	settings, err := loadSMTPSettings()
	if err != nil {
		log.Printf("Password reset email configuration error: %v", err)
		return c.JSON(http.StatusServiceUnavailable, echo.Map{
			"message": "Layanan email belum dikonfigurasi dengan benar. Silakan coba kembali nanti.",
		})
	}
	if _, err := resetURL("configuration-check"); err != nil {
		log.Printf("Password reset URL configuration error: %v", err)
		return c.JSON(http.StatusServiceUnavailable, echo.Map{
			"message": "Layanan email belum dikonfigurasi dengan benar. Silakan coba kembali nanti.",
		})
	}

	email, valid := normalizeEmail(req.Email)
	if !valid {
		return c.JSON(http.StatusAccepted, echo.Map{"message": resetResponse})
	}

	secret, err := jwtSigningSecret()
	if err != nil {
		log.Printf("Password reset configuration error: %v", err)
		return c.JSON(http.StatusAccepted, echo.Map{"message": resetResponse})
	}
	now := time.Now().UTC()
	emailHash := keyedDigest(secret, "email:"+email)
	ipAddress := c.Request().RemoteAddr
	if host, _, err := net.SplitHostPort(ipAddress); err == nil {
		ipAddress = host
	}
	ipHash := keyedDigest(secret, "ip:"+ipAddress)
	allowed, err := recordResetRequest(emailHash, ipHash, now)
	if err != nil {
		log.Printf("Password reset rate-limit storage error: %v", err)
		return c.JSON(http.StatusAccepted, echo.Map{"message": resetResponse})
	}
	if !allowed {
		return c.JSON(http.StatusAccepted, echo.Map{"message": resetResponse})
	}

	var user models.User
	if err := config.DB.Where("email = ?", email).First(&user).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("Password reset account lookup error: %v", err)
		}
		return c.JSON(http.StatusAccepted, echo.Map{"message": resetResponse})
	}

	token, tokenHash, err := newResetToken()
	if err != nil {
		log.Printf("Password reset token generation error: %v", err)
		return c.JSON(http.StatusAccepted, echo.Map{"message": resetResponse})
	}
	link, err := resetURL(token)
	if err != nil {
		log.Printf("Password reset URL configuration error: %v", err)
		return c.JSON(http.StatusAccepted, echo.Map{"message": resetResponse})
	}

	reset := models.PasswordResetToken{
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: now.Add(15 * time.Minute),
	}
	if err := config.DB.Create(&reset).Error; err != nil {
		log.Printf("Password reset token storage error: %v", err)
		return c.JSON(http.StatusAccepted, echo.Map{"message": resetResponse})
	}

	go func() {
		if err := sendResetEmail(settings, email, link); err != nil {
			log.Printf("Password reset email delivery error: %v", err)
			if deleteErr := config.DB.Delete(&reset).Error; deleteErr != nil {
				log.Printf("Password reset token cleanup error: %v", deleteErr)
			}
		}
	}()
	return c.JSON(http.StatusAccepted, echo.Map{"message": resetResponse})
}

func ResetPassword(c echo.Context) error {
	c.Response().Header().Set(echo.HeaderCacheControl, "no-store")
	var req resetPasswordRequest
	c.Request().Body = http.MaxBytesReader(c.Response(), c.Request().Body, 4096)
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "Format data tidak valid"})
	}
	if len(req.Token) > 128 || strings.TrimSpace(req.Token) == "" ||
		utf8.RuneCountInString(req.Password) < 12 || len(req.Password) > 72 {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"message": "Tautan tidak valid atau kedaluwarsa, atau password tidak memenuhi persyaratan.",
		})
	}

	tokenHashBytes := sha256.Sum256([]byte(req.Token))
	tokenHash := hex.EncodeToString(tokenHashBytes[:])
	now := time.Now().UTC()
	var invalidToken = errors.New("invalid or expired password reset token")
	err := config.DB.Transaction(func(tx *gorm.DB) error {
		var reset models.PasswordResetToken
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("token_hash = ? AND expires_at > ? AND used_at IS NULL", tokenHash, now).
			First(&reset).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return invalidToken
			}
			return err
		}

		passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		userUpdate := tx.Model(&models.User{}).Where("id = ?", reset.UserID).
			Updates(map[string]interface{}{
				"password_hash":   string(passwordHash),
				"session_version": gorm.Expr("session_version + 1"),
			})
		if userUpdate.Error != nil {
			return userUpdate.Error
		}
		if userUpdate.RowsAffected != 1 {
			return invalidToken
		}
		return tx.Model(&models.PasswordResetToken{}).
			Where("user_id = ? AND used_at IS NULL", reset.UserID).
			Update("used_at", now).Error
	})
	if errors.Is(err, invalidToken) {
		return c.JSON(http.StatusBadRequest, echo.Map{
			"message": "Tautan tidak valid atau kedaluwarsa.",
		})
	}
	if err != nil {
		log.Printf("Password reset completion error: %v", err)
		return c.JSON(http.StatusInternalServerError, echo.Map{
			"message": "Gagal mengatur ulang password. Silakan coba kembali.",
		})
	}
	return c.JSON(http.StatusOK, echo.Map{
		"message": "Password berhasil diperbarui. Silakan masuk dengan password baru.",
	})
}
