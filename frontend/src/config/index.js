function deriveDevelopmentApiBaseUrl() {
  const configuredDevHost = (process.env.REACT_APP_DEV_API_HOST || "").trim();
  const configuredDevPort = (process.env.REACT_APP_DEV_API_PORT || "").trim();
  const apiPort = configuredDevPort || "5000";

  if (typeof window === "undefined") {
    return `http://localhost:${apiPort}/api`;
  }

  const { hostname, protocol } = window.location;
  const host = configuredDevHost || hostname || "localhost";
  const apiProtocol = protocol === "https:" ? "https:" : "http:";

  return `${apiProtocol}//${host}:${apiPort}/api`;
}

function resolveApiBaseUrl() {
  const configured = (process.env.REACT_APP_API_BASE_URL || "").trim();
  const isAuto = !configured || configured.toLowerCase() === "auto";

  if (process.env.NODE_ENV === "development" && isAuto) {
    return deriveDevelopmentApiBaseUrl();
  }

  if (!configured || configured.toLowerCase() === "auto") {
    throw new Error("REACT_APP_API_BASE_URL is required outside development auto mode");
  }

  return configured;
}

export const appConfig = {
  env: process.env.NODE_ENV || "development",
  apiBaseUrl: resolveApiBaseUrl(),
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
};

export default appConfig;
