"use client"

import * as React from "react"

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
  ListChecksIcon,
  CalendarDaysIcon,
  BarChart3Icon,
  Settings2Icon,
  HeartPulseIcon,
  DumbbellIcon,
  BookOpenIcon,
} from "lucide-react"

const data = {
  user: {
    name: "Иван Петров",
    email: "ivan@example.com",
    avatar: "/avatars/ivan.jpg",
  },
  teams: [
    {
      name: "Трекер привычек",
      logo: <ListChecksIcon />,
      plan: "Личный",
    },
  ],
  navMain: [
    {
      title: "Привычки",
      url: "#",
      icon: <ListChecksIcon />,
      isActive: true,
      items: [
        { title: "Сегодня", url: "#" },
        { title: "Все привычки", url: "#" },
        { title: "Архив", url: "#" },
      ],
    },
    {
      title: "Статистика",
      url: "#",
      icon: <BarChart3Icon />,
      items: [
        { title: "Обзор", url: "#" },
        { title: "Серии", url: "#" },
        { title: "Отчёты", url: "#" },
      ],
    },
    {
      title: "Календарь",
      url: "#",
      icon: <CalendarDaysIcon />,
      items: [
        { title: "Месяц", url: "#" },
        { title: "Неделя", url: "#" },
      ],
    },
    {
      title: "Настройки",
      url: "#",
      icon: <Settings2Icon />,
      items: [
        { title: "Общие", url: "#" },
        { title: "Напоминания", url: "#" },
        { title: "Тема", url: "#" },
      ],
    },
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              <SidebarMenuItem>
                {/* ponytail: noop until create-habit feature exists; wire onClick then */}
                <SidebarMenuButton
                  tooltip="Создать привычку"
                  className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                >
                  <PlusCircleIcon />
                  <span>Создать привычку</span>
                </SidebarMenuButton>
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
