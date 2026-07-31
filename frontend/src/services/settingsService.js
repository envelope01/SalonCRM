import httpClient from "../api/httpClient";

export const settingsService = {
  getSettings(config = {}) {
    return httpClient.get("/settings", config);
  },

  updateSettings(payload) {
    return httpClient.put("/settings", payload);
  },
};
