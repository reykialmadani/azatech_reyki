// Penyimpanan token JWT di localStorage + notifikasi perubahan untuk useSyncExternalStore.
const TOKEN_KEY = "azatech_token";
const CHANGE_EVENT = "azatech:token-change";

const isBrowser = () => typeof window !== "undefined";

export function getToken(): string | null {
  return isBrowser() ? window.localStorage.getItem(TOKEN_KEY) : null;
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearToken() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// Dipanggil juga saat tab lain login/logout (event "storage").
export function subscribeToken(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
