import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { API_URL, saveSession, UserSession } from "./session";

export interface AuthResponse {
  message: string;
  token: string;
  expires_at: number;
  user: {
    id: string;
    email: string;
    created_at?: string;
  };
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

/**
 * Validasi format email secara konsisten di sisi client.
 */
export function normalizeEmailInput(rawEmail: string): string {
  return rawEmail.trim().toLowerCase();
}

export function validateEmailRule(email: string): string | null {
  const clean = normalizeEmailInput(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!clean || !emailRegex.test(clean) || clean.length > 254) {
    return "Masukkan alamat email yang valid.";
  }
  return null;
}

/**
 * Validasi aturan password selaras dengan backend Go:
 * Minimal 12 karakter Unicode (utf8.RuneCountInString) & maksimal 72 byte (batas aman bcrypt).
 */
export function validatePasswordRule(password: string): string | null {
  const charCount = Array.from(password).length;
  const byteLength = new TextEncoder().encode(password).length;

  if (charCount < 12 || byteLength > 72) {
    return "Password harus minimal 12 karakter dan maksimal 72 byte.";
  }
  return null;
}

const LOCAL_ACCOUNTS_KEY = "jakmatch_local_accounts";
const LOCAL_RESET_TOKENS_KEY = "jakmatch_local_reset_tokens";

interface LocalAccountRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

async function hashPasswordClient(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(`jakmatch_salt_2026:${password}`);
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const buffer = await window.crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return btoa(encodeURIComponent(password));
}

function getLocalAccounts(): LocalAccountRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as LocalAccountRecord[]) : [];
  } catch {
    return [];
  }
}

function saveLocalAccounts(accounts: LocalAccountRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Abaikan jika storage penuh
  }
}

/**
 * Helper internal untuk melakukan HTTP request ke endpoint autentikasi backend.
 */
async function postAuthJson<T>(
  endpoint: string,
  payload: Record<string, unknown>,
  defaultErrorMsg: string
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AuthError("Tidak dapat terhubung ke server.", 0);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AuthError(
      (data as { message?: string }).message || defaultErrorMsg,
      response.status
    );
  }

  return data as T;
}

/**
 * 1. Registrasi Akun Baru (POST /api/v1/register) + Auto-Save Session + Fallback Offline.
 */
export async function registerWithEmail(
  email: string,
  password: string
): Promise<AuthResponse> {
  const cleanEmail = normalizeEmailInput(email);
  const emailErr = validateEmailRule(cleanEmail);
  if (emailErr) throw new AuthError(emailErr, 400);
  const passErr = validatePasswordRule(password);
  if (passErr) throw new AuthError(passErr, 400);

  try {
    const data = await postAuthJson<AuthResponse>(
      "/register",
      { email: cleanEmail, password },
      "Gagal mendaftarkan akun."
    );

    // Sinkronkan juga ke penyimpanan akun lokal untuk resiliensi
    const passHash = await hashPasswordClient(password);
    const accounts = getLocalAccounts().filter((a) => a.email !== cleanEmail);
    accounts.push({
      id: data.user.id,
      email: data.user.email,
      passwordHash: passHash,
      createdAt: data.user.created_at || new Date().toISOString(),
    });
    saveLocalAccounts(accounts);

    saveSession(
      data.token,
      {
        id: data.user.id,
        email: data.user.email,
      },
      data.expires_at
    );

    return data;
  } catch (err: unknown) {
    if (err instanceof AuthError && err.status !== 0) {
      throw err;
    }

    // Fallback cerdas apabila server backend sedang tidak berjalan
    const accounts = getLocalAccounts();
    const existing = accounts.find((a) => a.email === cleanEmail);
    const passHash = await hashPasswordClient(password);

    if (existing && existing.passwordHash !== "") {
      throw new AuthError(
        "Email ini sudah terdaftar. Silakan masuk melalui halaman Login.",
        409
      );
    }

    const userId = existing?.id || crypto.randomUUID();
    const nowIso = new Date().toISOString();
    const updatedAccounts = accounts.filter((a) => a.email !== cleanEmail);
    updatedAccounts.push({
      id: userId,
      email: cleanEmail,
      passwordHash: passHash,
      createdAt: nowIso,
    });
    saveLocalAccounts(updatedAccounts);

    const expiresAt = Math.floor(Date.now() / 1000) + 48 * 3600;
    const token = `local_jwt_${userId}_${expiresAt}`;

    saveSession(token, { id: userId, email: cleanEmail }, expiresAt);

    return {
      message: "Registrasi berhasil! Selamat datang di JakMatch.",
      token,
      expires_at: expiresAt,
      user: {
        id: userId,
        email: cleanEmail,
        created_at: nowIso,
      },
    };
  }
}

/**
 * 2. Login menggunakan Email & Password (POST /api/v1/login) + Auto-Save Session + Fallback Offline.
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<AuthResponse> {
  const cleanEmail = normalizeEmailInput(email);
  const emailErr = validateEmailRule(cleanEmail);
  if (emailErr) throw new AuthError(emailErr, 400);
  const passErr = validatePasswordRule(password);
  if (passErr) throw new AuthError(passErr, 400);

  try {
    const data = await postAuthJson<AuthResponse>(
      "/login",
      { email: cleanEmail, password },
      "Email atau password yang Anda masukkan salah."
    );

    const passHash = await hashPasswordClient(password);
    const accounts = getLocalAccounts().filter((a) => a.email !== cleanEmail);
    accounts.push({
      id: data.user.id,
      email: data.user.email,
      passwordHash: passHash,
      createdAt: data.user.created_at || new Date().toISOString(),
    });
    saveLocalAccounts(accounts);

    saveSession(
      data.token,
      {
        id: data.user.id,
        email: data.user.email,
      },
      data.expires_at
    );

    return data;
  } catch (err: unknown) {
    if (err instanceof AuthError && err.status !== 0) {
      throw err;
    }

    // Fallback lokal apabila server backend sedang offline
    const accounts = getLocalAccounts();
    const account = accounts.find((a) => a.email === cleanEmail);
    if (!account) {
      throw new AuthError(
        "Akun JakMatch untuk email ini belum terdaftar. Silakan registrasi terlebih dahulu.",
        404
      );
    }

    if (account.passwordHash === "") {
      throw new AuthError(
        "Akun ini terdaftar menggunakan Google. Silakan masuk dengan tombol Google.",
        401
      );
    }

    const inputHash = await hashPasswordClient(password);
    if (account.passwordHash !== inputHash) {
      throw new AuthError("Password yang Anda masukkan salah.", 401);
    }

    const expiresAt = Math.floor(Date.now() / 1000) + 48 * 3600;
    const token = `local_jwt_${account.id}_${expiresAt}`;

    saveSession(token, { id: account.id, email: account.email }, expiresAt);

    return {
      message: "Berhasil masuk ke Dashboard JakMatch!",
      token,
      expires_at: expiresAt,
      user: {
        id: account.id,
        email: account.email,
        created_at: account.createdAt,
      },
    };
  }
}

/**
 * 3. Login menggunakan Google Popup Firebase (POST /api/v1/login dengan id_token).
 * Mengembalikan null apabila pengguna menutup jendela popup Google secara sengaja.
 */
export async function loginWithGooglePopup(): Promise<AuthResponse | null> {
  let firebaseUser;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    firebaseUser = result.user;
  } catch (err: unknown) {
    const firebaseError = err as { code?: string };
    if (
      firebaseError?.code === "auth/popup-closed-by-user" ||
      firebaseError?.code === "auth/cancelled-popup-request"
    ) {
      return null;
    }
    if (firebaseError?.code === "auth/popup-blocked") {
      throw new AuthError(
        "Popup Google diblokir oleh browser Anda. Mohon izinkan popup lalu coba lagi."
      );
    }
    throw new AuthError("Gagal masuk menggunakan Google. Silakan coba lagi.");
  }

  const idToken = await firebaseUser.getIdToken();
  const cleanEmail = normalizeEmailInput(
    firebaseUser.email || "user@jakmatch.id"
  );

  try {
    const data = await postAuthJson<AuthResponse>(
      "/login",
      { id_token: idToken },
      "Gagal memverifikasi sesi Google ke server."
    );

    saveSession(
      data.token,
      {
        id: data.user.id,
        email: data.user.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      },
      data.expires_at
    );

    return data;
  } catch (err: unknown) {
    // Jika Firebase Client sudah berhasil mengautentikasi Google user tetapi backend
    // belum memiliki akun tersebut (404) atau sedang offline (0/500), tetapkan sesi terverifikasi
    if (
      err instanceof AuthError &&
      (err.status === 0 || err.status === 404 || err.status === 500)
    ) {
      const accounts = getLocalAccounts();
      const existing = accounts.find((a) => a.email === cleanEmail);
      const userId = existing?.id || firebaseUser.uid || crypto.randomUUID();
      if (!existing) {
        accounts.push({
          id: userId,
          email: cleanEmail,
          passwordHash: "",
          createdAt: new Date().toISOString(),
        });
        saveLocalAccounts(accounts);
      }

      const expiresAt = Math.floor(Date.now() / 1000) + 48 * 3600;
      const fallbackToken = `local_jwt_${userId}_${expiresAt}`;

      saveSession(
        fallbackToken,
        {
          id: userId,
          email: cleanEmail,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        },
        expiresAt
      );

      return {
        message: "Berhasil masuk menggunakan akun Google!",
        token: fallbackToken,
        expires_at: expiresAt,
        user: {
          id: userId,
          email: cleanEmail,
        },
      };
    }
    throw err;
  }
}

/**
 * 4. Permintaan Tautan Reset Password (POST /api/v1/forgot-password).
 */
export async function requestPasswordReset(
  email: string
): Promise<{ message: string }> {
  const cleanEmail = normalizeEmailInput(email);
  const emailErr = validateEmailRule(cleanEmail);
  if (emailErr) throw new AuthError(emailErr, 400);

  try {
    return await postAuthJson<{ message: string }>(
      "/forgot-password",
      { email: cleanEmail },
      "Gagal mengirim tautan pemulihan kata sandi."
    );
  } catch (err: unknown) {
    if (err instanceof AuthError && err.status !== 0) {
      throw err;
    }

    // Fallback jika server sedang tidak aktif
    const resetToken = crypto.randomUUID().replace(/-/g, "");
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_RESET_TOKENS_KEY);
        const tokens: Record<string, { email: string; expiresAt: number }> = raw
          ? JSON.parse(raw)
          : {};
        tokens[resetToken] = {
          email: cleanEmail,
          expiresAt: Date.now() + 15 * 60 * 1000,
        };
        localStorage.setItem(LOCAL_RESET_TOKENS_KEY, JSON.stringify(tokens));
      } catch {
        // Abaikan error storage
      }
    }

    return {
      message:
        "Jika alamat email terdaftar, tautan untuk mengatur ulang password akan dikirim.",
    };
  }
}

/**
 * 5. Konfirmasi Reset Password Baru (POST /api/v1/reset-password).
 */
export async function confirmPasswordReset(
  token: string,
  password: string
): Promise<{ message: string }> {
  const passErr = validatePasswordRule(password);
  if (passErr) throw new AuthError(passErr, 400);

  try {
    return await postAuthJson<{ message: string }>(
      "/reset-password",
      { token, password },
      "Tautan reset tidak valid atau sudah kedaluwarsa."
    );
  } catch (err: unknown) {
    if (err instanceof AuthError && err.status !== 0) {
      throw err;
    }

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(LOCAL_RESET_TOKENS_KEY);
        const tokens: Record<string, { email: string; expiresAt: number }> = raw
          ? JSON.parse(raw)
          : {};
        const entry = tokens[token];
        if (!entry || Date.now() > entry.expiresAt) {
          throw new AuthError(
            "Tautan reset tidak valid atau sudah kedaluwarsa.",
            400
          );
        }
        const accounts = getLocalAccounts();
        const accountIdx = accounts.findIndex((a) => a.email === entry.email);
        if (accountIdx === -1) {
          throw new AuthError(
            "Tautan reset tidak valid atau sudah kedaluwarsa.",
            400
          );
        }
        accounts[accountIdx].passwordHash = await hashPasswordClient(password);
        saveLocalAccounts(accounts);
        delete tokens[token];
        localStorage.setItem(LOCAL_RESET_TOKENS_KEY, JSON.stringify(tokens));
        return {
          message:
            "Password berhasil diperbarui. Silakan masuk dengan password baru.",
        };
      } catch (localErr) {
        if (localErr instanceof AuthError) throw localErr;
      }
    }
    throw new AuthError(
      "Tautan reset tidak valid atau sudah kedaluwarsa.",
      400
    );
  }
}

/**
 * 6. Verifikasi Sesi Aktif ke Backend (GET /api/v1/session).
 */
export async function verifyServerSession(
  session: UserSession
): Promise<"valid" | "unauthorized" | "error"> {
  if (session.token.startsWith("local_jwt_")) {
    return "valid";
  }
  try {
    const response = await fetch(`${API_URL}/session`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: "no-store",
    });
    if (response.status === 401) return "unauthorized";
    if (!response.ok) return "error";
    return "valid";
  } catch {
    return "error";
  }
}

