"use client"

import { Link } from "react-router-dom"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar"
import { FolderIcon } from "lucide-react"

export function NavProjects({ categories }: { categories: string[] }) {
  if (categories.length === 0) return null

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Категории</SidebarGroupLabel>
      <SidebarMenu>
        {categories.map((name) => (
          <SidebarMenuItem key={name}>
            <SidebarMenuButton asChild>
              <Link to={`/habits?category=${encodeURIComponent(name)}`}>
                <FolderIcon />
                <span>{name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
