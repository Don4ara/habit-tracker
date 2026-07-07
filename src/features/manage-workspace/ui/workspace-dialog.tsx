import { useState } from "react"
import { toast } from "sonner"

import {
  addWorkspace,
  renameWorkspace,
  type Workspace,
} from "@/entities/workspace"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { EmojiButton } from "@/shared/ui/emoji-button"

// Родитель задаёт key при открытии — компонент монтируется с чистым состоянием.
export function WorkspaceDialog({
  open,
  onOpenChange,
  workspace,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspace?: Workspace
}) {
  const isEdit = !!workspace
  const [name, setName] = useState(workspace?.name ?? "")
  const [icon, setIcon] = useState(workspace?.icon ?? "")

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (isEdit) {
      renameWorkspace(workspace!.id, trimmed, icon || undefined)
      toast.success("Пространство обновлено")
    } else {
      addWorkspace(trimmed, icon || undefined)
      toast.success(`Пространство «${trimmed}» создано`)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Переименовать пространство" : "Новое пространство"}
          </DialogTitle>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="ws-name">Название</Label>
            <div className="flex gap-2">
              <EmojiButton value={icon} onSelect={setIcon} />
              <Input
                id="ws-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например, Работа"
                autoFocus
              />
            </div>
          </div>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Отмена</Button>
          </DialogClose>
          <Button onClick={submit} disabled={!name.trim()}>
            {isEdit ? "Сохранить" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
