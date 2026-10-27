package seeders

import (
	"log"

	"jakmatch-backend/config"
	"jakmatch-backend/models"
)

func SeedDatabase() {
	// 1. Seed Tabel user_profiles
	var profileCount int64
	config.DB.Model(&models.UserProfile{}).Count(&profileCount)
	if profileCount == 0 {
		profiles := []models.UserProfile{
			{ProfileKey: "student_worker", ProfileLabel: "Mahasiswa / Pekerja Lajang", PropertyType: "Indekos / Apartemen Studio"},
			{ProfileKey: "family", ProfileLabel: "Keluarga", PropertyType: "Rumah Tapak / Kontrakan"},
			{ProfileKey: "umkm", ProfileLabel: "Pelaku UMKM", PropertyType: "Ruko / Kios Komersial"},
		}
		config.DB.Create(&profiles)
		log.Println("Seeder: Data user_profiles berhasil ditambahkan.")
	}

	// 2. Seed Tabel districts (Contoh data awal kecamatan DKI Jakarta)
	var districtCount int64
	config.DB.Model(&models.District{}).Count(&districtCount)
	if districtCount == 0 {
		districts := []models.District{
			{
				DistrictName: "Tebet", CityRegion: "Jakarta Selatan", TierZone: 1,
				TransportScore: 92.5, EnvironmentScore: 78.0, FloodFreeScore: 75.0,
				HealthScore: 88.0, MarketDensityScore: 94.0, BaseRentalCost: 3500000,
			},
			{
				DistrictName: "Jagakarsa", CityRegion: "Jakarta Selatan", TierZone: 2,
				TransportScore: 80.0, EnvironmentScore: 88.5, FloodFreeScore: 90.0,
				HealthScore: 82.0, MarketDensityScore: 76.0, BaseRentalCost: 2200000,
			},
			{
				DistrictName: "Menteng", CityRegion: "Jakarta Pusat", TierZone: 1,
				TransportScore: 96.0, EnvironmentScore: 90.0, FloodFreeScore: 88.0,
				HealthScore: 95.0, MarketDensityScore: 89.0, BaseRentalCost: 6500000,
			},
			{
				DistrictName: "Duren Sawit", CityRegion: "Jakarta Timur", TierZone: 2,
				TransportScore: 78.0, EnvironmentScore: 80.0, FloodFreeScore: 82.0,
				HealthScore: 84.0, MarketDensityScore: 85.0, BaseRentalCost: 2000000,
			},
			{
				DistrictName: "Palmerah", CityRegion: "Jakarta Barat", TierZone: 2,
				TransportScore: 86.0, EnvironmentScore: 74.0, FloodFreeScore: 80.0,
				HealthScore: 85.0, MarketDensityScore: 91.0, BaseRentalCost: 2500000,
			},
		}
		config.DB.Create(&districts)
		log.Println("Seeder: Data awal districts berhasil ditambahkan.")
	}
}
