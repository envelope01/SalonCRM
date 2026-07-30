import httpClient from "../api/httpClient";

export const clientService = {
  getClients() {
    return httpClient.get("/clients");
  },

  getClientById(id) {
    return httpClient.get(`/clients/${id}`);
  },

  searchClients(query) {
    return httpClient.get("/clients/search", { params: { q: query } });
  },

  createClient(payload) {
    return httpClient.post("/clients", payload);
  },

  updateClient(id, payload) {
    return httpClient.put(`/clients/${id}`, payload);
  },

  deleteClient(id) {
    return httpClient.delete(`/clients/${id}`);
  },
};
