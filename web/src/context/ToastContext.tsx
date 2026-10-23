'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';

export type ToastSeverity = 'success' | 'error' | 'warning' | 'info';
type ToastValue = { showToast: (message: string, severity?: ToastSeverity) => void };
type ToastNotice = { id: number; message: string; severity: ToastSeverity };

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [notice, setNotice] = useState<ToastNotice | null>(null);
  const nextId = useRef(0);
  const showToast = useCallback((message: string, severity: ToastSeverity = 'success') => {
    nextId.current += 1;
    setNotice({ id: nextId.current, message, severity });
  }, []);
  const closeToast = useCallback(() => setNotice(null), []);
  const value = useMemo(() => ({ showToast }), [showToast]);

  return <ToastContext.Provider value={value}>
    {children}
    <Snackbar key={notice?.id} open={!!notice} autoHideDuration={5000} onClose={closeToast} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <Alert onClose={closeToast} severity={notice?.severity ?? 'info'} variant="filled" elevation={6} sx={{ minWidth: 280, maxWidth: 'min(520px, calc(100vw - 32px))', borderRadius: '12px', fontSize: 15, fontWeight: 650, boxShadow: '0 10px 32px #061b3833' }}>
        {notice?.message}
      </Alert>
    </Snackbar>
  </ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast deve ser usado dentro de ToastProvider.');
  return context;
}
