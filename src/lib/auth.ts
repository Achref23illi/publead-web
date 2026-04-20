// Prototype auth — localStorage mirror of the original prototype's
// `publeader_auth` key + a lightweight cookie so Next.js middleware can
// enforce an auth gate server-side. Swap with a real session when the
// backend is ready.

export const AUTH_KEY = "publeader_auth";
export const AUTH_COOKIE = "publeader_auth";

function setCookie(value: string, maxAgeSec: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE}=${value}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax`;
}

export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(AUTH_KEY) === "1";
  } catch {
    return false;
  }
}

export function signIn(): void {
  try {
    localStorage.setItem(AUTH_KEY, "1");
  } catch {
    /* ignore */
  }
  setCookie("1", 60 * 60 * 24 * 7); // 7 days
}

export function signOut(): void {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {
    /* ignore */
  }
  setCookie("", 0);
}
