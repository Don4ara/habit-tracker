import type { ReactNode } from "react"

import { SidebarProvider } from "@/shared/ui/sidebar"
import { ThemeProvider } from "./theme-provider"

// Sidebar сам пишет cookie `sidebar_state` при переключении — читаем его при старте.
function readSidebarOpen(): boolean {
  const m = document.cookie.match(/(?:^|;\s*)sidebar_state=(true|false)/)
  return m ? m[1] === "true" : true
}

export function IndexProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SidebarProvider defaultOpen={readSidebarOpen()}>
        {children}
      </SidebarProvider>
    </ThemeProvider>
  )
}
