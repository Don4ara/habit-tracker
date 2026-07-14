import { useEffect, useState } from "react"
import { Swords } from "lucide-react"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

import { addChallenge } from "@/entities/challenge"
import { addHabit, type WeekDay } from "@/entities/habit"
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

const EVERY_DAY: WeekDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

interface Incoming {
  title: string
  icon?: string
  goal: number
  by?: string
}

function stripParam() {
  history.replaceState(null, "", location.pathname)
}

/** Ловит ссылку-приглашение (#challenge=…) и предлагает принять челлендж. */
export function ChallengeGate() {
  const navigate = useNavigate()
  const [incoming, setIncoming] = useState<Incoming | null>(null)

  useEffect(() => {
    const payload = new URLSearchParams(location.hash.slice(1)).get("challenge")
    if (!payload) return
    let cancelled = false
    ;(async () => {
      try {
        const parsed = JSON.parse(await decodePayload(payload))
        if (typeof parsed.t !== "string" || typeof parsed.g !== "number")
          throw new Error("bad")
        if (!cancelled)
          setIncoming({ title: parsed.t, icon: parsed.i, goal: parsed.g, by: parsed.by })
      } catch {
        if (!cancelled) {
          toast.error("Ссылка приглашения повреждена")
          stripParam()
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const accept = () => {
    if (incoming) {
      const habit = addHabit({
        name: incoming.title,
        icon: incoming.icon,
        category: "Челлендж",
        days: EVERY_DAY,
      })
      if (habit) {
        addChallenge({ habitId: habit.id, ...incoming })
        toast.success(`Челлендж «${incoming.title}» принят`)
        navigate("/")
      } else {
        toast.error(`Привычка «${incoming.title}» уже есть`)
      }
    }
    stripParam()
    setIncoming(null)
  }

  const decline = () => {
    stripParam()
    setIncoming(null)
  }

  return (
    <Dialog open={!!incoming} onOpenChange={(o) => !o && decline()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="size-5 text-primary" />
            Вызов на челлендж
          </DialogTitle>
          <DialogDescription>
            {incoming?.by ? `${incoming.by} зовёт вас` : "Вас зовут"} на челлендж
            «{incoming?.title}» — {incoming?.goal} дней. Примете вызов?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={decline}>
            Не сейчас
          </Button>
          <Button onClick={accept}>
            <Swords className="size-4" />
            Принять вызов
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
