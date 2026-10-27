package main

import (
	"net/http"
	"jakmatch-backend/config"
	"github.com/labstack/echo/v4"
)

func main() {
	// Inisiasi database
	config.ConnectDB()

	e := echo.New()
	
	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "Backend JakMatch berjalan dengan Database Terkoneksi!")
	})
	
	e.Logger.Fatal(e.Start(":8080"))
}