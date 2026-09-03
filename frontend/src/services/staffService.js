import httpClient from "../api/httpClient";

export const staffService = {
  listStaff() {
    return httpClient.get("/staff");
  },

  createStaff(payload) {
    return httpClient.post("/staff", payload);
  },
};
