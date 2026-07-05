import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar"
import { navigate, useRoute, type Route } from "@/shared/lib"

export function NavMain({
  items,
}: {
  items: {
    title: string
    route: Route
    icon?: React.ReactNode
  }[]
}) {
  const active = useRoute()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Меню</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={active === item.route}
              onClick={() => navigate(item.route)}
            >
              {item.icon}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
