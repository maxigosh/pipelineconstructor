"use client"

import { ThemeProvider } from "@/components/ThemeProvider"
import { ToastProvider } from "@/components/ui/toast"
import { Sidebar } from "@/components/Sidebar"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ToastProvider>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6 md:p-8 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </ToastProvider>
    </ThemeProvider>
  )
}
