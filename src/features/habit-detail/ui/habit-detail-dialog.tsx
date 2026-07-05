import type { ReactNode } from "react"
import { Flame, Trophy } from "lucide-react"

import {
  useCompletions,
  getStreak,
  bestStreak,
  habitRate,
  habitHeatmap,
  type Habit,
  type WeekDay,
} from "@/entities/habit"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"
import { cn } from "@/shared/lib/utils"

const WEEK: { id: WeekDay; label: string }[] = [
  { id: "mon", label: "Пн" },
  { id: "tue", label: "Вт" },
  { id: "wed", label: "Ср" },
  { id: "thu", label: "Чт" },
  { id: "fri", label: "Пт" },
  { id: "sat", label: "Сб" },
  { id: "sun", label: "Вс" },
]

function cellClass(c: {
  scheduled: boolean
  done: boolean
  future: boolean
}): string {
  if (c.future) return "bg-transparent"
  if (c.done) return "bg-primary"
  if (c.scheduled) return "bg-muted"
  return "bg-muted/25"
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border p-3">
      <div className="text-muted-foreground flex items-center gap-1 text-xs">
        {icon}
        {label}
      </div>
      <div className="font-heading text-xl font-semibold tabular-nums">
        {value}
      </div>
    </div>
  )
}

export function HabitDetailDialog({
  habit,
  trigger,
}: {
  habit: Habit
  trigger: ReactNode
}) {
  const completions = useCompletions()
  const total = completions[habit.id]?.length ?? 0
  const heat = habitHeatmap(habit, completions, 14)

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid size-8 place-content-center rounded-md bg-muted text-lg">
              {habit.icon || habit.name.charAt(0).toUpperCase()}
            </span>
            {habit.name}
          </DialogTitle>
        </DialogHeader>

        <div className="text-muted-foreground text-sm">
          {habit.category} ·{" "}
          {habit.days.length === 7
            ? "каждый день"
            : WEEK.filter((w) => habit.days.includes(w.id))
                .map((w) => w.label)
                .join(", ")}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="Серия"
            value={getStreak(habit)}
            icon={<Flame className="size-3.5" />}
          />
          <Stat
            label="Рекорд"
            value={bestStreak(habit, completions)}
            icon={<Trophy className="size-3.5" />}
          />
          <Stat label="30 дней" value={`${Math.round(habitRate(habit, completions, 30) * 100)}%`} />
          <Stat label="Всего" value={total} />
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-muted-foreground text-xs">Последние 14 недель</div>
          <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto">
            {heat.map((c) => (
              <div
                key={c.key}
                title={c.key}
                className={cn("size-3 rounded-[2px]", cellClass(c))}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
