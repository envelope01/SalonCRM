const listeners = new Set();

const defaultDurations = {
  success: 3000,
  info: 3500,
  warning: 4500,
  error: 6000,
};

function createToast(type, message, options = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    message,
    title: options.title,
    durationMs: options.durationMs || defaultDurations[type] || 4000,
  };
}

export function subscribeToToasts(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function showToast(type, message, options) {
  if (!message) return;

  const toast = createToast(type, message, options);
  listeners.forEach((listener) => listener(toast));
}

export const toast = {
  success(message, options) {
    showToast("success", message, options);
  },

  info(message, options) {
    showToast("info", message, options);
  },

  warning(message, options) {
    showToast("warning", message, options);
  },

  error(message, options) {
    showToast("error", message, options);
  },
};

export function notifyApiError(error) {
  const status = error.response?.status;
  const isTechnicalError = !status || status >= 500;

  if (isTechnicalError) {
    toast.error("Please contact administrator", { title: "Technical Error" });
    return;
  }

  const message = error.response?.data?.message || "Request could not be completed";

  toast.error(message, { title: status ? `API Error ${status}` : "API Error" });
}
