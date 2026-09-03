import httpClient from "../api/httpClient";

export const authService = {
  login(credentials) {
    return httpClient.post("/auth/login", credentials);
  },

  me() {
    return httpClient.get("/auth/me");
  },

  changePassword(payload) {
    return httpClient.put("/auth/password", payload);
  },
};
