import { useEffect, useState } from "react"
import type { ReactNode } from "react"

import { ThemeContext } from "@/shared/lib"
import type { Theme, ThemeContextValue } from "@/shared/lib"

const STORAGE_KEY = "ui-theme"

export function ThemeProvider({
  children,
  defaultTheme = "light",
}: {
  children: ReactNode
  defaultTheme?: Theme
}) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? defaultTheme
  )

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const value: ThemeContextValue = {
    theme,
    setTheme,
    toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
