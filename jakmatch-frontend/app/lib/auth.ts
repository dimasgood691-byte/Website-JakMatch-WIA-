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
 * 1. Registrasi Akun Baru (POST /api/v1/register) + Auto-Save Session.
 */
export async function registerWithEmail(
  email: string,
  password: string
): Promise<AuthResponse> {
  const cleanEmail = normalizeEmailInput(email);
  const data = await postAuthJson<AuthResponse>(
    "/register",
    { email: cleanEmail, password },
    "Gagal mendaftarkan akun."
  );

  saveSession(data.token, {
    id: data.user.id,
    email: data.user.email,
  });

  return data;
}

/**
 * 2. Login menggunakan Email & Password (POST /api/v1/login) + Auto-Save Session.
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<AuthResponse> {
  const cleanEmail = normalizeEmailInput(email);
  const data = await postAuthJson<AuthResponse>(
    "/login",
    { email: cleanEmail, password },
    "Email atau password yang Anda masukkan salah."
  );

  saveSession(data.token, {
    id: data.user.id,
    email: data.user.email,
  });

  return data;
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
    if (firebaseError?.code === "auth/popup-closed-by-user") {
      return null;
    }
    throw new AuthError("Gagal masuk menggunakan Google. Silakan coba lagi.");
  }

  const idToken = await firebaseUser.getIdToken();
  const data = await postAuthJson<AuthResponse>(
    "/login",
    { id_token: idToken },
    "Akun Google ini belum terdaftar di sistem. Silakan registrasi terlebih dahulu."
  );

  saveSession(data.token, {
    id: data.user.id,
    email: data.user.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
  });

  return data;
}

/**
 * 4. Permintaan Tautan Reset Password (POST /api/v1/forgot-password).
 */
export async function requestPasswordReset(
  email: string
): Promise<{ message: string }> {
  const cleanEmail = normalizeEmailInput(email);
  return postAuthJson<{ message: string }>(
    "/forgot-password",
    { email: cleanEmail },
    "Gagal mengirim tautan pemulihan kata sandi."
  );
}

/**
 * 5. Konfirmasi Reset Password Baru (POST /api/v1/reset-password).
 */
export async function confirmPasswordReset(
  token: string,
  password: string
): Promise<{ message: string }> {
  return postAuthJson<{ message: string }>(
    "/reset-password",
    { token, password },
    "Tautan reset tidak valid atau sudah kedaluwarsa."
  );
}

/**
 * 6. Verifikasi Sesi Aktif ke Backend (GET /api/v1/session).
 */
export async function verifyServerSession(
  session: UserSession
): Promise<"valid" | "unauthorized" | "error"> {
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

