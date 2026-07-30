import httpClient from "../api/httpClient";

export const reportService = {
  getSummary(params) {
    return httpClient.get("/reports/summary", { params });
  },
};
