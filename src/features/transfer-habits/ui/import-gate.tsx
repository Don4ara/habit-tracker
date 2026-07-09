import { useEffect, useState } from "react"
import { Download } from "lucide-react"
import { toast } from "sonner"

import { useNavigate } from "react-router-dom"

import { importData } from "@/entities/habit"
import { decodePayload } from "@/shared/lib"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"

interface Incoming {
  json: string
  habits: number
  completions: number
}

function stripParam() {
  history.replaceState(null, "", location.pathname)
}

export function ImportGate() {
  const navigate = useNavigate()
  const [incoming, setIncoming] = useState<Incoming | null>(null)

  useEffect(() => {
    const payload =
      new URLSearchParams(location.hash.slice(1)).get("import") ??
      new URLSearchParams(location.search).get("import")
    if (!payload) return
    let cancelled = false
    ;(async () => {
      try {
        const json = await decodePayload(payload)
        const parsed = JSON.parse(json) as {
          habits?: unknown[]
          completions?: Record<string, string[]>
        }
        if (!Array.isArray(parsed.habits)) throw new Error("bad")
        const completions = parsed.completions
          ? Object.values(parsed.completions).reduce((s, a) => s + a.length, 0)
          : 0
        if (!cancelled)
          setIncoming({ json, habits: parsed.habits.length, completions })
      } catch {
        if (!cancelled) {
          toast.error("Ссылка переноса повреждена")
          stripParam()
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const confirm = () => {
    if (incoming && importData(incoming.json)) {
      toast.success(`Загружено привычек: ${incoming.habits}`)
      navigate("/")
    } else {
      toast.error("Не удалось загрузить данные")
    }
    stripParam()
    setIncoming(null)
  }

  const cancel = () => {
    stripParam()
    setIncoming(null)
  }

  return (
    <Dialog open={!!incoming} onOpenChange={(o) => !o && cancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Загрузить привычки?</DialogTitle>
          <DialogDescription>
            Перенос с другого устройства: {incoming?.habits} привычек и{" "}
            {incoming?.completions} отметок. Текущие данные на этом устройстве
            будут заменены.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={cancel}>
            Отмена
          </Button>
          <Button onClick={confirm}>
            <Download className="size-4" />
            Загрузить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
