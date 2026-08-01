import httpClient from "../api/httpClient";

export const appointmentService = {
  getAppointments(params) {
    return httpClient.get("/appointments", { params });
  },

  createAppointment(payload) {
    return httpClient.post("/appointments", payload);
  },

  updateAppointment(id, payload) {
    return httpClient.put(`/appointments/${id}`, payload);
  },

  deleteAppointment(id) {
    return httpClient.delete(`/appointments/${id}`);
  },
};
