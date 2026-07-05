import { HomePage } from "@/pages/home"
import { HabitsPage } from "@/pages/habits"
import { StatsPage } from "@/pages/stats"
import { AchievementsPage } from "@/pages/achievements"
import { SettingsPage } from "@/pages/settings"
import { AppSidebar } from "@/widgets/app-sidebar"
import { ImportGate } from "@/features/transfer-habits"
import { SidebarInset } from "@/shared/ui/sidebar"
import { Toaster } from "@/shared/ui/sonner"
import { useRoute } from "@/shared/lib"
import { IndexProvider } from "./providers"

function CurrentPage() {
  const route = useRoute()
  switch (route) {
    case "habits":
      return <HabitsPage />
    case "stats":
      return <StatsPage />
    case "achievements":
      return <AchievementsPage />
    case "settings":
      return <SettingsPage />
    default:
      return <HomePage />
  }
}

export function App() {
  return (
    <IndexProvider>
      <AppSidebar />
      <SidebarInset>
        <CurrentPage />
      </SidebarInset>
      <Toaster />
      <ImportGate />
    </IndexProvider>
  )
}
