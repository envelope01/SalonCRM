import httpClient from "../api/httpClient";

export const visitService = {
  createVisit(payload) {
    return httpClient.post("/visits", payload);
  },

  getClientVisits(clientId) {
    return httpClient.get(`/visits/client/${clientId}`);
  },

  deleteVisit(visitId) {
    return httpClient.delete(`/visits/${visitId}`);
  },
};
