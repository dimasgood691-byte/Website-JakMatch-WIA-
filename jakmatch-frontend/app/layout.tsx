import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JakMatch — Sistem Pendukung Keputusan Lokasi DKI Jakarta",
  description:
    "Platform cerdas berbasis data untuk rekomendasi lokasi hunian dan ekspansi bisnis di DKI Jakarta.",
  icons: {
    icon: [
      { url: "/assets/logo-jakmatch.png?v=3", type: "image/png" },
    ],
    shortcut: "/assets/logo-jakmatch.png?v=3",
    apple: "/assets/logo-jakmatch.png?v=3",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}