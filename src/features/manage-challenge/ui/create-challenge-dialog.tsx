import { useState, type ReactNode } from "react"
import { Swords } from "lucide-react"
import { toast } from "sonner"

import { addChallenge, type Challenge } from "@/entities/challenge"
import { addHabit, type WeekDay } from "@/entities/habit"
import { useUserName } from "@/entities/profile"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"
import { EmojiButton } from "@/shared/ui/emoji-button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { ChallengeQR } from "./challenge-qr"

const EVERY_DAY: WeekDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
const CHALLENGE_CATEGORY = "Челлендж"

export function CreateChallengeDialog({ trigger }: { trigger: ReactNode }) {
  const name = useUserName()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [icon, setIcon] = useState("")
  const [goal, setGoal] = useState(21)
  const [created, setCreated] = useState<Challenge | null>(null)

  const reset = () => {
    setTitle("")
    setIcon("")
    setGoal(21)
    setCreated(null)
  }

  const handleOpen = (next: boolean) => {
    if (next) reset()
    setOpen(next)
  }

  const submit = () => {
    if (!title.trim()) return
    // Челлендж стоит на реальной привычке — отмечается на дашборде.
    const habit = addHabit({
      name: title,
      icon: icon || undefined,
      category: CHALLENGE_CATEGORY,
      days: EVERY_DAY,
    })
    if (!habit) {
      toast.error(`Привычка «${title.trim()}» уже существует`)
      return
    }
    setCreated(addChallenge({ habitId: habit.id, title, icon, goal, by: name }))
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Позовите друга</DialogTitle>
              <DialogDescription>
                Пусть друг отсканирует код — челлендж «{created.title}» появится в
                его достижениях, и вы пойдёте к цели вместе.
              </DialogDescription>
            </DialogHeader>
            <ChallengeQR challenge={created} />
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Готово</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Swords className="size-5 text-primary" />
                Новый челлендж
              </DialogTitle>
              <DialogDescription>
                Совместная цель на несколько дней. Каждый отмечает свои дни —
                кто дойдёт до финиша?
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="challenge-title">Название</Label>
                <div className="flex gap-2">
                  <EmojiButton value={icon} onSelect={setIcon} />
                  <Input
                    id="challenge-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    placeholder="Например, 21 день без сахара"
                    autoFocus
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="challenge-goal">Дней до цели</Label>
                <Input
                  id="challenge-goal"
                  type="number"
                  min={1}
                  max={365}
                  value={goal}
                  onChange={(e) => setGoal(Number(e.target.value))}
                  className="w-28"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button onClick={submit} disabled={!title.trim() || goal < 1}>
                Создать и позвать
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
