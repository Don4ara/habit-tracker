"use client"

import * as React from "react"

import { CreateHabitDialog } from "@/features/create-habit"
import { ThemeToggle } from "@/features/theme-toggle"
import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"
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
} from "@/shared/ui/sidebar"
import {
  PlusCircleIcon,
  HomeIcon,
  ListChecksIcon,
  BarChart3Icon,
  Settings2Icon,
  HeartPulseIcon,
  DumbbellIcon,
  BookOpenIcon,
  TrophyIcon,
} from "lucide-react"

const data = {
  user: {
    name: "Иван Петров",
    email: "ivan@example.com",
    avatar: "/avatars/ivan.jpg",
  },
  navMain: [
    { title: "Главная", to: "/", icon: <HomeIcon /> },
    { title: "Привычки", to: "/habits", icon: <ListChecksIcon /> },
    { title: "Статистика", to: "/stats", icon: <BarChart3Icon /> },
    { title: "Достижения", to: "/achievements", icon: <TrophyIcon /> },
    { title: "Настройки", to: "/settings", icon: <Settings2Icon /> },
  ],
  projects: [
    {
      name: "Здоровье",
      url: "#",
      icon: <HeartPulseIcon />,
    },
    {
      name: "Спорт",
      url: "#",
      icon: <DumbbellIcon />,
    },
    {
      name: "Учёба",
      url: "#",
      icon: <BookOpenIcon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <ThemeToggle />
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
