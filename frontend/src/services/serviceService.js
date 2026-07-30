import httpClient from "../api/httpClient";

export const serviceService = {
  getServices() {
    return httpClient.get("/services");
  },

  createService(payload) {
    return httpClient.post("/services", payload);
  },

  updateService(id, payload) {
    return httpClient.put(`/services/${id}`, payload);
  },

  deleteService(id) {
    return httpClient.delete(`/services/${id}`);
  },

  toggleServiceStatus(id) {
    return httpClient.put(`/services/toggle/${id}`);
  },
};
