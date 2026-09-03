import httpClient from "../api/httpClient";

export const adminService = {
  getDashboard() {
    return httpClient.get("/admin/dashboard");
  },

  registerSalon(payload) {
    return httpClient.post("/admin/salons", payload);
  },

  updateSalonStatus(id, payload) {
    return httpClient.put(`/admin/salons/${id}/status`, payload);
  },

  resetOwnerPassword(id, payload) {
    return httpClient.put(`/admin/salons/${id}/owner-password`, payload);
  },

  deleteSalon(id, payload) {
    return httpClient.delete(`/admin/salons/${id}`, { data: payload });
  },

  createPlatformUser(payload) {
    return httpClient.post("/admin/platform-users", payload);
  },

};
