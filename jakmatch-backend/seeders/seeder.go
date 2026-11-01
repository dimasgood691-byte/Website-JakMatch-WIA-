package seeders

import (
	"fmt"
	"log"

	"jakmatch-backend/config"
	"jakmatch-backend/models"
)

func SeedDatabase() error {
	// 1. Seeding Master Data user_profiles
	profiles := []models.UserProfile{
		{ProfileKey: "student_worker", ProfileLabel: "Mahasiswa / Pekerja Lajang", PropertyType: "Indekos / Apartemen Studio"},
		{ProfileKey: "family", ProfileLabel: "Keluarga", PropertyType: "Rumah Tapak / Kontrakan"},
		{ProfileKey: "umkm", ProfileLabel: "Pelaku UMKM", PropertyType: "Ruko / Kios Komersial"},
	}

	for _, p := range profiles {
		var existing models.UserProfile
		if err := config.DB.Where("profile_key = ?", p.ProfileKey).FirstOrCreate(&existing, p).Error; err != nil {
			return fmt.Errorf("gagal menambahkan user_profile %s: %w", p.ProfileKey, err)
		}
	}

	// 2. Seeding Master Data 42 Kecamatan DKI Jakarta (Skala 0-100 mengacu indikator BPS DKI Jakarta)
	districts := []models.District{
		// ==================== JAKARTA PUSAT (8 Kecamatan) ====================
		{DistrictName: "Menteng", CityRegion: "Jakarta Pusat", TierZone: 1, TransportScore: 96.0, EnvironmentScore: 90.0, FloodFreeScore: 88.0, HealthScore: 95.0, MarketDensityScore: 89.0, BaseRentalCost: 6500000},
		{DistrictName: "Tanah Abang", CityRegion: "Jakarta Pusat", TierZone: 1, TransportScore: 97.5, EnvironmentScore: 72.0, FloodFreeScore: 76.0, HealthScore: 89.0, MarketDensityScore: 98.5, BaseRentalCost: 5800000},
		{DistrictName: "Gambir", CityRegion: "Jakarta Pusat", TierZone: 1, TransportScore: 96.5, EnvironmentScore: 86.0, FloodFreeScore: 89.0, HealthScore: 93.0, MarketDensityScore: 88.0, BaseRentalCost: 5500000},
		{DistrictName: "Sawah Besar", CityRegion: "Jakarta Pusat", TierZone: 1, TransportScore: 91.0, EnvironmentScore: 75.0, FloodFreeScore: 78.0, HealthScore: 88.0, MarketDensityScore: 92.0, BaseRentalCost: 4200000},
		{DistrictName: "Kemayoran", CityRegion: "Jakarta Pusat", TierZone: 2, TransportScore: 88.0, EnvironmentScore: 77.0, FloodFreeScore: 81.0, HealthScore: 87.0, MarketDensityScore: 90.0, BaseRentalCost: 3500000},
		{DistrictName: "Senen", CityRegion: "Jakarta Pusat", TierZone: 2, TransportScore: 93.0, EnvironmentScore: 74.0, FloodFreeScore: 82.0, HealthScore: 94.0, MarketDensityScore: 93.5, BaseRentalCost: 3600000},
		{DistrictName: "Cempaka Putih", CityRegion: "Jakarta Pusat", TierZone: 2, TransportScore: 86.0, EnvironmentScore: 84.0, FloodFreeScore: 86.0, HealthScore: 92.0, MarketDensityScore: 85.0, BaseRentalCost: 3800000},
		{DistrictName: "Johar Baru", CityRegion: "Jakarta Pusat", TierZone: 3, TransportScore: 84.0, EnvironmentScore: 68.0, FloodFreeScore: 79.0, HealthScore: 83.0, MarketDensityScore: 94.0, BaseRentalCost: 2300000},

		// ==================== JAKARTA SELATAN (10 Kecamatan) ====================
		{DistrictName: "Kebayoran Baru", CityRegion: "Jakarta Selatan", TierZone: 1, TransportScore: 95.5, EnvironmentScore: 89.0, FloodFreeScore: 85.0, HealthScore: 94.0, MarketDensityScore: 95.0, BaseRentalCost: 6200000},
		{DistrictName: "Setiabudi", CityRegion: "Jakarta Selatan", TierZone: 1, TransportScore: 96.0, EnvironmentScore: 85.0, FloodFreeScore: 88.0, HealthScore: 93.0, MarketDensityScore: 96.5, BaseRentalCost: 6400000},
		{DistrictName: "Mampang Prapatan", CityRegion: "Jakarta Selatan", TierZone: 1, TransportScore: 89.0, EnvironmentScore: 78.0, FloodFreeScore: 74.0, HealthScore: 87.0, MarketDensityScore: 91.0, BaseRentalCost: 4500000},
		{DistrictName: "Pancoran", CityRegion: "Jakarta Selatan", TierZone: 1, TransportScore: 91.0, EnvironmentScore: 79.0, FloodFreeScore: 77.0, HealthScore: 88.0, MarketDensityScore: 90.0, BaseRentalCost: 4100000},
		{DistrictName: "Tebet", CityRegion: "Jakarta Selatan", TierZone: 1, TransportScore: 92.5, EnvironmentScore: 78.0, FloodFreeScore: 75.0, HealthScore: 88.0, MarketDensityScore: 94.0, BaseRentalCost: 3500000},
		{DistrictName: "Cilandak", CityRegion: "Jakarta Selatan", TierZone: 2, TransportScore: 90.0, EnvironmentScore: 86.0, FloodFreeScore: 83.0, HealthScore: 91.0, MarketDensityScore: 88.5, BaseRentalCost: 4300000},
		{DistrictName: "Kebayoran Lama", CityRegion: "Jakarta Selatan", TierZone: 2, TransportScore: 88.5, EnvironmentScore: 80.0, FloodFreeScore: 79.0, HealthScore: 89.0, MarketDensityScore: 91.5, BaseRentalCost: 3900000},
		{DistrictName: "Pasar Minggu", CityRegion: "Jakarta Selatan", TierZone: 2, TransportScore: 87.5, EnvironmentScore: 81.0, FloodFreeScore: 80.0, HealthScore: 87.0, MarketDensityScore: 89.0, BaseRentalCost: 3200000},
		{DistrictName: "Pesanggrahan", CityRegion: "Jakarta Selatan", TierZone: 2, TransportScore: 82.0, EnvironmentScore: 81.0, FloodFreeScore: 78.0, HealthScore: 84.0, MarketDensityScore: 83.0, BaseRentalCost: 2700000},
		{DistrictName: "Jagakarsa", CityRegion: "Jakarta Selatan", TierZone: 2, TransportScore: 80.0, EnvironmentScore: 88.5, FloodFreeScore: 90.0, HealthScore: 82.0, MarketDensityScore: 76.0, BaseRentalCost: 2200000},

		// ==================== JAKARTA BARAT (8 Kecamatan) ====================
		{DistrictName: "Grogol Petamburan", CityRegion: "Jakarta Barat", TierZone: 1, TransportScore: 91.5, EnvironmentScore: 75.0, FloodFreeScore: 74.0, HealthScore: 92.0, MarketDensityScore: 95.0, BaseRentalCost: 3800000},
		{DistrictName: "Kembangan", CityRegion: "Jakarta Barat", TierZone: 1, TransportScore: 85.0, EnvironmentScore: 86.0, FloodFreeScore: 83.0, HealthScore: 90.0, MarketDensityScore: 89.0, BaseRentalCost: 4400000},
		{DistrictName: "Taman Sari", CityRegion: "Jakarta Barat", TierZone: 1, TransportScore: 89.0, EnvironmentScore: 70.0, FloodFreeScore: 75.0, HealthScore: 86.0, MarketDensityScore: 96.0, BaseRentalCost: 3400000},
		{DistrictName: "Palmerah", CityRegion: "Jakarta Barat", TierZone: 2, TransportScore: 86.0, EnvironmentScore: 74.0, FloodFreeScore: 80.0, HealthScore: 85.0, MarketDensityScore: 91.0, BaseRentalCost: 2500000},
		{DistrictName: "Kebon Jeruk", CityRegion: "Jakarta Barat", TierZone: 2, TransportScore: 85.5, EnvironmentScore: 80.0, FloodFreeScore: 81.0, HealthScore: 89.0, MarketDensityScore: 88.0, BaseRentalCost: 3100000},
		{DistrictName: "Tambora", CityRegion: "Jakarta Barat", TierZone: 2, TransportScore: 84.0, EnvironmentScore: 66.0, FloodFreeScore: 72.0, HealthScore: 82.0, MarketDensityScore: 95.5, BaseRentalCost: 2400000},
		{DistrictName: "Cengkareng", CityRegion: "Jakarta Barat", TierZone: 3, TransportScore: 82.0, EnvironmentScore: 73.0, FloodFreeScore: 70.0, HealthScore: 84.0, MarketDensityScore: 91.0, BaseRentalCost: 2100000},
		{DistrictName: "Kalideres", CityRegion: "Jakarta Barat", TierZone: 3, TransportScore: 78.0, EnvironmentScore: 74.0, FloodFreeScore: 72.0, HealthScore: 81.0, MarketDensityScore: 86.0, BaseRentalCost: 1850000},

		// ==================== JAKARTA TIMUR (10 Kecamatan) ====================
		{DistrictName: "Jatinegara", CityRegion: "Jakarta Timur", TierZone: 1, TransportScore: 90.0, EnvironmentScore: 74.0, FloodFreeScore: 72.0, HealthScore: 89.0, MarketDensityScore: 93.0, BaseRentalCost: 3100000},
		{DistrictName: "Matraman", CityRegion: "Jakarta Timur", TierZone: 1, TransportScore: 89.5, EnvironmentScore: 77.0, FloodFreeScore: 82.0, HealthScore: 88.0, MarketDensityScore: 90.0, BaseRentalCost: 2900000},
		{DistrictName: "Pulo Gadung", CityRegion: "Jakarta Timur", TierZone: 2, TransportScore: 86.5, EnvironmentScore: 79.0, FloodFreeScore: 83.0, HealthScore: 88.5, MarketDensityScore: 89.0, BaseRentalCost: 3000000},
		{DistrictName: "Duren Sawit", CityRegion: "Jakarta Timur", TierZone: 2, TransportScore: 78.0, EnvironmentScore: 80.0, FloodFreeScore: 82.0, HealthScore: 84.0, MarketDensityScore: 85.0, BaseRentalCost: 2000000},
		{DistrictName: "Kramat Jati", CityRegion: "Jakarta Timur", TierZone: 2, TransportScore: 84.0, EnvironmentScore: 76.0, FloodFreeScore: 75.0, HealthScore: 87.5, MarketDensityScore: 89.0, BaseRentalCost: 2200000},
		{DistrictName: "Cakung", CityRegion: "Jakarta Timur", TierZone: 2, TransportScore: 81.0, EnvironmentScore: 73.0, FloodFreeScore: 74.0, HealthScore: 83.0, MarketDensityScore: 88.0, BaseRentalCost: 1950000},
		{DistrictName: "Makasar", CityRegion: "Jakarta Timur", TierZone: 2, TransportScore: 83.0, EnvironmentScore: 78.0, FloodFreeScore: 79.0, HealthScore: 84.0, MarketDensityScore: 82.0, BaseRentalCost: 2150000},
		{DistrictName: "Ciracas", CityRegion: "Jakarta Timur", TierZone: 3, TransportScore: 79.0, EnvironmentScore: 83.0, FloodFreeScore: 85.0, HealthScore: 82.0, MarketDensityScore: 80.0, BaseRentalCost: 1850000},
		{DistrictName: "Pasar Rebo", CityRegion: "Jakarta Timur", TierZone: 3, TransportScore: 78.5, EnvironmentScore: 82.0, FloodFreeScore: 84.0, HealthScore: 83.0, MarketDensityScore: 81.0, BaseRentalCost: 1800000},
		{DistrictName: "Cipayung", CityRegion: "Jakarta Timur", TierZone: 3, TransportScore: 77.5, EnvironmentScore: 88.0, FloodFreeScore: 87.0, HealthScore: 81.0, MarketDensityScore: 77.0, BaseRentalCost: 1700000},

		// ==================== JAKARTA UTARA (6 Kecamatan) ====================
		{DistrictName: "Kelapa Gading", CityRegion: "Jakarta Utara", TierZone: 1, TransportScore: 86.0, EnvironmentScore: 84.0, FloodFreeScore: 73.0, HealthScore: 92.0, MarketDensityScore: 96.0, BaseRentalCost: 5200000},
		{DistrictName: "Penjaringan", CityRegion: "Jakarta Utara", TierZone: 1, TransportScore: 84.0, EnvironmentScore: 81.0, FloodFreeScore: 71.0, HealthScore: 89.0, MarketDensityScore: 93.0, BaseRentalCost: 4600000},
		{DistrictName: "Pademangan", CityRegion: "Jakarta Utara", TierZone: 1, TransportScore: 85.0, EnvironmentScore: 76.0, FloodFreeScore: 73.0, HealthScore: 86.0, MarketDensityScore: 92.0, BaseRentalCost: 3700000},
		{DistrictName: "Tanjung Priok", CityRegion: "Jakarta Utara", TierZone: 2, TransportScore: 86.0, EnvironmentScore: 72.0, FloodFreeScore: 76.0, HealthScore: 85.0, MarketDensityScore: 90.0, BaseRentalCost: 2600000},
		{DistrictName: "Koja", CityRegion: "Jakarta Utara", TierZone: 3, TransportScore: 79.0, EnvironmentScore: 73.0, FloodFreeScore: 75.0, HealthScore: 84.0, MarketDensityScore: 86.0, BaseRentalCost: 1900000},
		{DistrictName: "Cilincing", CityRegion: "Jakarta Utara", TierZone: 3, TransportScore: 76.0, EnvironmentScore: 71.0, FloodFreeScore: 73.0, HealthScore: 80.0, MarketDensityScore: 84.0, BaseRentalCost: 1650000},
	}

	for _, d := range districts {
		var existing models.District
		if err := config.DB.Where("district_name = ?", d.DistrictName).FirstOrCreate(&existing, d).Error; err != nil {
			return fmt.Errorf("gagal menambahkan district %s: %w", d.DistrictName, err)
		}
	}

	log.Println("Seeder: 42 data kecamatan DKI Jakarta (BPS) & profil pengguna siap digunakan!")
	return nil
}