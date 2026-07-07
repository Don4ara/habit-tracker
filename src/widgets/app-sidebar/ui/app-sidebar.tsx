"use client"

import * as React from "react"
import { useLocation } from "react-router-dom"

import { CreateHabitDialog } from "@/features/create-habit"
import { ThemeToggle } from "@/features/theme-toggle"
import { useAllHabits } from "@/entities/habit"
import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { TeamSwitcher } from "./team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/shared/ui/sidebar"
import {
  PlusCircleIcon,
  HomeIcon,
  ListChecksIcon,
  BarChart3Icon,
  Settings2Icon,
  TrophyIcon,
} from "lucide-react"

const data = {
  navMain: [
    { title: "Главная", to: "/", icon: <HomeIcon /> },
    { title: "Привычки", to: "/habits", icon: <ListChecksIcon /> },
    { title: "Статистика", to: "/stats", icon: <BarChart3Icon /> },
    { title: "Достижения", to: "/achievements", icon: <TrophyIcon /> },
    { title: "Настройки", to: "/settings", icon: <Settings2Icon /> },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const habits = useAllHabits()
  const categories = [...new Set(habits.map((h) => h.category))]
  const { isMobile, setOpenMobile } = useSidebar()
  const location = useLocation()

  // Закрываем мобильный сайдбар ПОСЛЕ смены маршрута — новая страница уже отрисована.
  React.useEffect(() => {
    if (isMobile) setOpenMobile(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search])

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <CreateHabitDialog
                  trigger={
                    <SidebarMenuButton className="min-w-8 bg-primary text-primary-foreground ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground">
                      <PlusCircleIcon />
                      <span>Создать привычку</span>
                    </SidebarMenuButton>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <NavMain items={data.navMain} />
        <NavProjects categories={categories} />
      </SidebarContent>
      <SidebarFooter>
        <ThemeToggle />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
