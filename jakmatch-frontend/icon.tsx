import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const size = {
    width: 64,
    height: 64,
};
export const contentType = "image/png";

export default function Icon() {
    // Membaca file logo-jakmatch.png langsung dari folder public/assets
    const logoPath = join(process.cwd(), "public", "assets", "logo-jakmatch.png");
    const logoData = readFileSync(logoPath);
    const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    // GAYA KONTAINER: Pilih warna background (#FFFFFF putih atau #0B1526 navy)
                    background: "#FFFFFF",
                    // BENTUK SUDUT: 16px untuk kotak rounded modern, atau "50%" untuk lingkaran penuh
                    borderRadius: "16px",
                    // PADDING: Memberi jarak agar logo tidak gepeng/terpotong di pinggir tab
                    padding: "8px"
                }}
            >
                <img
                    src={logoBase64}
                    alt="JakMatch Logo"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                    }}
                />
            </div>
        ),
        {
            ...size,
        }
    );
}