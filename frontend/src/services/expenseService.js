import httpClient from "../api/httpClient";

export const expenseService = {
  getExpenses(params) {
    return httpClient.get("/expenses", { params });
  },

  createExpense(payload) {
    return httpClient.post("/expenses", payload);
  },

  deleteExpense(id) {
    return httpClient.delete(`/expenses/${id}`);
  },
};
