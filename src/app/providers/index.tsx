import type { ReactNode } from "react"

import { SidebarProvider } from "@/shared/ui/sidebar"
import { ThemeProvider } from "./theme-provider"

export function IndexProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SidebarProvider>{children}</SidebarProvider>
    </ThemeProvider>
  )
}
