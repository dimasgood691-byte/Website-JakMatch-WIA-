package config

import (
	"context"
	"log"
	"os"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

var FirebaseAuth *auth.Client

func InitFirebase() {
	var opt option.ClientOption

	// 1. Prioritas Utama (Untuk Cloud / Railway): Baca dari Environment Variable JSON String
	credJSON := os.Getenv("FIREBASE_CREDENTIALS_JSON")
	if credJSON != "" {
		opt = option.WithCredentialsJSON([]byte(credJSON))
	} else {
		// 2. Fallback (Untuk Laptop Lokal): Baca dari file fisik serviceAccountKey.json
		credPath := os.Getenv("FIREBASE_CREDENTIALS_PATH")
		if credPath == "" {
			credPath = "serviceAccountKey.json"
		}
		opt = option.WithCredentialsFile(credPath)
	}

	app, err := firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		log.Printf("Peringatan: Gagal inisialisasi Firebase App (%v). Pastikan FIREBASE_CREDENTIALS_JSON atau serviceAccountKey.json sudah diatur.", err)
		return
	}

	client, err := app.Auth(context.Background())
	if err != nil {
		log.Printf("Peringatan: Gagal menginisialisasi Firebase Auth Client: %v", err)
		return
	}

	FirebaseAuth = client
	log.Println("Firebase Admin SDK berhasil terhubung!")
}
