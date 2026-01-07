import axios from "axios";

/* =========================================================
   API CONFIGURATION
   ========================================================= */
const API_BASE_URL = "https://nblcrm-backend.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});


/* =========================================================
   REQUEST INTERCEPTOR
   Automatically attach auth token if present
   ========================================================= */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


/* =========================================================
   AUTH HELPERS
   ========================================================= */
export function saveAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user || {}));
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}


/* =========================================================
   EXPORT
   ========================================================= */
export default api;
