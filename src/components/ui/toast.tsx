"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
})

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...toast, id }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "rounded-lg border p-4 shadow-lg animate-in slide-in-from-right-full",
              toast.variant === "destructive" && "border-destructive bg-destructive text-destructive-foreground",
              toast.variant === "success" && "border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100",
              (!toast.variant || toast.variant === "default") && "border-border bg-background text-foreground"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                {toast.title && <p className="font-semibold text-sm">{toast.title}</p>}
                {toast.description && <p className="text-sm mt-1 opacity-90">{toast.description}</p>}
              </div>
              <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  return { toast: context.addToast, toasts: context.toasts }
}
