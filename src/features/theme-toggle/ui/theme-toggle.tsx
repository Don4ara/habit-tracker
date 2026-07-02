import { MoonIcon, SunIcon } from "lucide-react"

import { useTheme } from "@/shared/lib"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"
  const label = isDark ? "Светлая тема" : "Тёмная тема"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={toggleTheme} tooltip={label}>
          {isDark ? <SunIcon /> : <MoonIcon />}
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
