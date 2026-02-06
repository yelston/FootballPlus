'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

export type ToastKind = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  message: string
  kind: ToastKind
}

interface ToastContextValue {
  pushToast: (message: string, kind?: ToastKind) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TOAST_DURATION_MS = 3500

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = `${Date.now()}-${Math.random()}`
    const toast: ToastItem = { id, message, kind }

    setToasts((prev) => [toast, ...prev])

    window.setTimeout(() => {
      removeToast(id)
    }, TOAST_DURATION_MS)
  }, [removeToast])

  const value = useMemo(() => ({
    pushToast,
    success: (message: string) => pushToast(message, 'success'),
    error: (message: string) => pushToast(message, 'error'),
    info: (message: string) => pushToast(message, 'info'),
  }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:w-auto">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'rounded-md border px-4 py-3 text-sm shadow-sm backdrop-blur-sm',
              toast.kind === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-900',
              toast.kind === 'error' && 'border-destructive/30 bg-destructive/10 text-destructive',
              toast.kind === 'info' && 'border-border bg-background text-foreground'
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
