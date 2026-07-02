import { HomePage } from "@/pages/home"
import { AppSidebar } from "@/widgets/app-sidebar"
import { SidebarInset } from "@/shared/ui/sidebar"
import { Toaster } from "@/shared/ui/sonner"
import { IndexProvider } from "./providers"

export function App() {
  return (
    <IndexProvider>
      <AppSidebar />
      <SidebarInset>
        <HomePage />
      </SidebarInset>
      <Toaster />
    </IndexProvider>
  )
}
