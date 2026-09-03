import React, { useEffect, useState } from "react";
import { subscribeToToasts } from "./toastBus";

const styles = {
  success: {
    wrapper: "border-emerald-200 bg-emerald-50 text-emerald-900",
    icon: "bg-emerald-500",
    title: "Success",
  },
  info: {
    wrapper: "border-sky-200 bg-sky-50 text-sky-900",
    icon: "bg-sky-500",
    title: "Notice",
  },
  warning: {
    wrapper: "border-amber-200 bg-amber-50 text-amber-900",
    icon: "bg-amber-500",
    title: "Warning",
  },
  error: {
    wrapper: "border-rose-200 bg-rose-50 text-rose-900",
    icon: "bg-rose-500",
    title: "Error",
  },
};

function ToastItem({ toast, onRemove }) {
  const [closing, setClosing] = useState(false);
  const style = styles[toast.type] || styles.info;

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setClosing(true), Math.max(toast.durationMs - 250, 0));
    const removeTimer = window.setTimeout(() => onRemove(toast.id), toast.durationMs);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, [onRemove, toast.durationMs, toast.id]);

  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-lg transition-all duration-300 ${
        style.wrapper
      } ${closing ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`}
    >
      <span className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${style.icon}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title || style.title}</p>
        <p className="mt-0.5 text-sm font-medium leading-snug opacity-90">{toast.message}</p>
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        className="rounded-lg px-2 text-lg font-semibold leading-none opacity-60 transition-opacity hover:opacity-100"
        onClick={() => onRemove(toast.id)}
      >
        x
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    return subscribeToToasts((toast) => {
      setToasts((current) => [toast, ...current].slice(0, 4));
    });
  }, []);

  const removeToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  return (
    <>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </>
  );
}
