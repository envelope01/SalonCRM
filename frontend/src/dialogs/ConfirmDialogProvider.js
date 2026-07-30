import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ConfirmDialogContext = createContext(null);

const defaultOptions = {
  title: "Are you sure?",
  message: "Please confirm this action.",
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  tone: "danger",
};

const toneStyles = {
  danger: {
    icon: "bg-rose-100 text-rose-500",
    confirm: "bg-rose-500 text-white shadow-rose-500/20",
  },
  primary: {
    icon: "bg-brandPink/10 text-brandPink",
    confirm: "bg-primary text-white shadow-primary/20",
  },
};

export function ConfirmDialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        ...defaultOptions,
        ...options,
        resolve,
      });
    });
  }, []);

  const close = useCallback((result) => {
    setDialog((current) => {
      if (current?.resolve) current.resolve(result);
      return null;
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);
  const styles = toneStyles[dialog?.tone] || toneStyles.danger;

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {dialog && (
          <motion.div
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-gray-950/45 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => close(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
              className="w-full max-w-sm rounded-[2rem] bg-white p-6 text-center shadow-2xl"
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${styles.icon}`}>
                <span className="text-xl font-black">!</span>
              </div>
              <h2 id="confirm-dialog-title" className="mt-4 text-xl font-black text-gray-900">
                {dialog.title}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-500">
                {dialog.message}
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  className="w-1/2 rounded-2xl bg-gray-100 py-3 text-sm font-black text-gray-600 transition-transform active:scale-95"
                  onClick={() => close(false)}
                >
                  {dialog.cancelLabel}
                </button>
                <button
                  type="button"
                  className={`w-1/2 rounded-2xl py-3 text-sm font-black shadow-lg transition-transform active:scale-95 ${styles.confirm}`}
                  onClick={() => close(true)}
                >
                  {dialog.confirmLabel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmDialogContext);

  if (!context) {
    throw new Error("useConfirm must be used inside ConfirmDialogProvider");
  }

  return context.confirm;
}
