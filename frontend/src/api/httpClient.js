import axios from "axios";
import { appConfig } from "../config";
import { getToken } from "./authStorage";
import { notifyApiError } from "../notifications/toastBus";

const IDEMPOTENT_METHODS = new Set(["get", "head", "options"]);

const httpClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 20000,
});

function requestId() {
  const browserCrypto = typeof window !== "undefined" ? window.crypto : null;
  if (browserCrypto && typeof browserCrypto.randomUUID === "function") {
    return browserCrypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

httpClient.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers["X-Request-Id"] = config.headers["X-Request-Id"] || requestId();
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const method = String(config.method || "get").toLowerCase();
    const status = error.response?.status;
    const shouldRetry =
      !config.__retried &&
      IDEMPOTENT_METHODS.has(method) &&
      (!status || status >= 500);

    if (shouldRetry) {
      config.__retried = true;
      await new Promise((resolve) => setTimeout(resolve, 250));
      return httpClient(config);
    }

    if (!config.suppressGlobalErrorToast) {
      notifyApiError(error);
    }

    return Promise.reject(error);
  },
);

export default httpClient;
