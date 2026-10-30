import { signOut } from "firebase/auth";
import { auth } from "./firebase";

const SESSION_KEY = "jakmatch_session";
const INACTIVITY_LIMIT_MS = 48 * 60 * 60 * 1000; // 48 Jam

export interface UserSession {
    token: string;
    user: {
        id: string;
        email: string;
        displayName?: string | null;
        photoURL?: string | null;
    };
    lastActive: number;
}

export const saveSession = (token: string, user: UserSession["user"]) => {
    if (typeof window === "undefined") return;
    const sessionData: UserSession = { token, user, lastActive: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
};

export const getValidSession = (): UserSession | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    try {
        const session: UserSession = JSON.parse(raw);
        if (Date.now() - session.lastActive > INACTIVITY_LIMIT_MS) {
            clearSession();
            return null;
        }
        session.lastActive = Date.now();
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        return session;
    } catch {
        clearSession();
        return null;
    }
};

export const clearSession = async () => {
    if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
    try {
        await signOut(auth);
    } catch { }
};