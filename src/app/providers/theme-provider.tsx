import { useCallback, useLayoutEffect, useState } from "react"
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

  useLayoutEffect(() => {
    const root = document.documentElement
    root.classList.add("theme-switching") // гасим css-переходы на время смены
    root.classList.remove("light", "dark")
    root.classList.add(theme)
    localStorage.setItem(STORAGE_KEY, theme)
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => root.classList.remove("theme-switching"))
    )
    return () => cancelAnimationFrame(id)
  }, [theme])

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    []
  )

  const value: ThemeContextValue = { theme, setTheme, toggleTheme }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
