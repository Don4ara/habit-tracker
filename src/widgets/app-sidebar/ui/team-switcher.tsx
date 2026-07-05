import { useState } from "react"
import {
  CheckIcon,
  ChevronsUpDownIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

import {
  useWorkspaces,
  useActiveWorkspaceId,
  setActiveWorkspace,
  removeWorkspace,
  type Workspace,
} from "@/entities/workspace"
import { WorkspaceDialog } from "@/features/manage-workspace"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/ui/sidebar"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"

function badge(ws: Workspace) {
  return ws.icon || ws.name.charAt(0).toUpperCase()
}

type DialogState = { mode: "add" } | { mode: "edit"; ws: Workspace } | null

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const workspaces = useWorkspaces()
  const activeId = useActiveWorkspaceId()
  const [dialog, setDialog] = useState<DialogState>(null)
  const [toDelete, setToDelete] = useState<Workspace | null>(null)

  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0]
  if (!active) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {badge(active)}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{active.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  Пространство
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Пространства
            </DropdownMenuLabel>
            {workspaces.map((ws) => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => setActiveWorkspace(ws.id)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border text-xs">
                  {badge(ws)}
                </div>
                <span className="flex-1 truncate">{ws.name}</span>
                {ws.id === activeId && <CheckIcon className="size-4" />}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => setDialog({ mode: "edit", ws: active })}
            >
              <PencilIcon className="size-4" />
              Переименовать
            </DropdownMenuItem>
            {workspaces.length > 1 && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive gap-2 p-2"
                onClick={() => setToDelete(active)}
              >
                <Trash2Icon className="size-4" />
                Удалить
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => setDialog({ mode: "add" })}
            >
              <PlusIcon className="size-4" />
              <span className="text-muted-foreground font-medium">
                Добавить пространство
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <WorkspaceDialog
        key={
          dialog
            ? `${dialog.mode}-${"ws" in dialog ? dialog.ws.id : "new"}`
            : "closed"
        }
        open={!!dialog}
        onOpenChange={(o) => !o && setDialog(null)}
        workspace={dialog?.mode === "edit" ? dialog.ws : undefined}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Удалить пространство?"
        description={
          <>
            «{toDelete?.name}» и все его привычки будут удалены. Действие
            необратимо.
          </>
        }
        onConfirm={() => toDelete && removeWorkspace(toDelete.id)}
      />
    </SidebarMenu>
  )
}
