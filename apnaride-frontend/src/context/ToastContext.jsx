import React, { createContext, useContext, useCallback } from 'react';

const ToastContext = createContext({
  success: (msg) => {},
  error: (msg) => {},
  info: (msg) => {},
});

export function ToastProvider({ children }) {
  const show = useCallback((prefix, msg) => {
    if (typeof window !== 'undefined' && window?.Notification && Notification.permission === 'granted') {
      new Notification(`${prefix}`, { body: msg });
    } else if (typeof window !== 'undefined' && window?.Notification && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    // Fallback
    // eslint-disable-next-line no-alert
    try { console.log(`${prefix}: ${msg}`); } catch {}
  }, []);

  const success = useCallback((msg) => show('✅ Success', msg), [show]);
  const error = useCallback((msg) => show('❌ Error', msg), [show]);
  const info = useCallback((msg) => show('ℹ️ Info', msg), [show]);

  return (
    <ToastContext.Provider value={{ success, error, info }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
