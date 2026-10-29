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
	credPath := os.Getenv("FIREBASE_CREDENTIALS_PATH")
	if credPath == "" {
		credPath = "serviceAccountKey.json"
	}

	opt := option.WithCredentialsFile(credPath)
	app, err := firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		log.Printf("Peringatan: Gagal inisialisasi Firebase App (%v). Pastikan serviceAccountKey.json sudah ada.", err)
		return
	}

	client, err := app.Auth(context.Background())
	if err != nil {
		log.Fatalf("Gagal menginisialisasi Firebase Auth Client: %v", err)
	}

	FirebaseAuth = client
	log.Println("Firebase Admin SDK berhasil terhubung!")
}
