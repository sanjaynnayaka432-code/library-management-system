import React, { createContext, useContext, useState, useEffect } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl shadow-xl text-sm font-medium transition-all transform duration-300 animate-slide-in backdrop-blur-md border ${
              t.type === 'success'
                ? 'bg-emerald-500/95 text-white border-emerald-400'
                : t.type === 'error'
                ? 'bg-rose-500/95 text-white border-rose-400'
                : t.type === 'warning'
                ? 'bg-amber-500/95 text-white border-amber-400'
                : 'bg-slate-900/95 text-white border-slate-700 dark:bg-slate-800/95'
            }`}
          >
            <div className="flex items-center gap-2 mr-2">
              {t.type === 'success' && <span>✓</span>}
              {t.type === 'error' && <span>✕</span>}
              {t.type === 'warning' && <span>⚠️</span>}
              {t.type === 'info' && <span>ℹ️</span>}
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-3 text-white/80 hover:text-white text-base leading-none focus:outline-none"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
