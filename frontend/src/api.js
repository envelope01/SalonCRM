import httpClient from "./api/httpClient";

export {
  clearAuth,
  getCurrentUser,
  saveAuth,
} from "./api/authStorage";

export default httpClient;
