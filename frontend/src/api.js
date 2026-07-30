import axios from "axios";

/* =========================================================
   API CONFIGURATION
   ========================================================= */
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("REACT_APP_API_BASE_URL is required");
}

const api = axios.create({
  baseURL: API_BASE_URL,
});

/* =========================================================
   REQUEST INTERCEPTOR
   Automatically attach auth token if present
   ========================================================= */
api.interceptors.request.use((config) => {
  // Switched to sessionStorage for auto-logout on close
  const token = sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* =========================================================
   AUTH HELPERS
   ========================================================= */
export function saveAuth(token, user) {
  sessionStorage.setItem("token", token);
  sessionStorage.setItem("user", JSON.stringify(user || {}));
}

export function clearAuth() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");
}

export function getCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

/* =========================================================
   EXPORT
   ========================================================= */
export default api;
