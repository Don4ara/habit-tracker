import { useEffect } from "react"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"

import { HomePage } from "@/pages/home"
import { HabitsPage } from "@/pages/habits"
import { StatsPage } from "@/pages/stats"
import { AchievementsPage } from "@/pages/achievements"
import { SettingsPage } from "@/pages/settings"
import { AppSidebar } from "@/widgets/app-sidebar"
import { ImportGate } from "@/features/transfer-habits"
import { OnboardingGate } from "@/features/onboarding"
import { SidebarInset } from "@/shared/ui/sidebar"
import { Toaster } from "@/shared/ui/sonner"
import { IndexProvider } from "./providers"

const APP_NAME = "Трекер привычек"
const TITLES: Record<string, string> = {
  "/": "Главная",
  "/habits": "Привычки",
  "/stats": "Статистика",
  "/achievements": "Достижения",
  "/settings": "Настройки",
}

function DocumentTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.title = `${TITLES[pathname] ?? "Главная"} · ${APP_NAME}`
  }, [pathname])
  return null
}

export function App() {
  return (
    <IndexProvider>
      <DocumentTitle />
      <AppSidebar />
      <SidebarInset>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SidebarInset>
      <Toaster />
      <ImportGate />
      <OnboardingGate />
    </IndexProvider>
  )
}
