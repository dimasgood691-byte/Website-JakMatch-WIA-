import { signOut } from "firebase/auth";
import { auth } from "./firebase";

const SESSION_KEY = "jakmatch_session";
const INACTIVITY_LIMIT_MS = 48 * 60 * 60 * 1000; // 48 Jam

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export interface UserSession {
  token: string;
  user: {
    id: string;
    email: string;
    displayName?: string | null;
    photoURL?: string | null;
  };
  lastActive: number;
  expiresAt?: number;
}

/**
 * Menyimpan token JWT dan profil pengguna ke localStorage dengan timestamp aktivitas terbaru.
 */
export const saveSession = (
  token: string,
  user: UserSession["user"],
  expiresAt?: number
): void => {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const sessionData: UserSession = {
    token,
    user,
    lastActive: now,
    expiresAt: expiresAt ? expiresAt * 1000 : now + INACTIVITY_LIMIT_MS,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  localStorage.setItem("jakmatch_token", token);
};

/**
 * Mengambil sesi aktif dari localStorage dan memperbarui waktu aktivitas terakhir.
 * Mengembalikan null jika sesi tidak ditemukan atau sudah melewati batas inaktivitas 48 jam.
 */
export const getValidSession = (): UserSession | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const session: UserSession = JSON.parse(raw);
    const now = Date.now();
    const isExpiredByInactivity = now - session.lastActive > INACTIVITY_LIMIT_MS;
    const isExpiredByToken =
      typeof session.expiresAt === "number" && now > session.expiresAt;

    if (
      !session.token ||
      !session.user?.id ||
      !session.user?.email ||
      isExpiredByInactivity ||
      isExpiredByToken
    ) {
      void clearSession();
      return null;
    }

    session.lastActive = now;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  } catch {
    void clearSession();
    return null;
  }
};

/**
 * Menghapus sesi dari localStorage, mencabut sesi JWT di server (/logout), dan keluar dari Firebase Auth.
 */
export const clearSession = async (): Promise<void> => {
  let tokenToRevoke: string | null = null;

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserSession>;
        tokenToRevoke = parsed.token || null;
      }
    } catch {
      // Abaikan jika JSON korup
    }
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("jakmatch_token");
    localStorage.removeItem("session");
    localStorage.removeItem("token");
  }

  if (tokenToRevoke && !tokenToRevoke.startsWith("local_jwt_")) {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenToRevoke}` },
      });
    } catch {
      // Abaikan jika server sedang offline saat logout
    }
  }

  try {
    await signOut(auth);
  } catch {
    // Abaikan jika belum login di Firebase
  }
};
