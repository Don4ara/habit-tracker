import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { Flame, Snowflake, Trophy } from "lucide-react"

import {
  useCompletions,
  useNotes,
  getNote,
  setNote,
  useFreezes,
  useFreezeLimit,
  useFreezeLock,
  isFreezeLocked,
  isFrozen,
  toggleFreeze,
  getStreak,
  bestStreak,
  habitRate,
  habitHeatmap,
  freezesLeftThisMonth,
  dateKey,
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
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { cn } from "@/shared/lib/utils"

const NOTE_MAX = 100

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
  if (c.done) return "bg-success"
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

function FreezeControl({ habit }: { habit: Habit }) {
  const todayKey = dateKey()
  useFreezes() // ре-рендер при смене заморозок
  const limit = useFreezeLimit()
  useFreezeLock() // ре-рендер при смене блокировки
  const locked = isFreezeLocked()
  const frozen = isFrozen(habit.id, todayKey)
  const left = freezesLeftThisMonth()

  const onClick = () => {
    const ok = toggleFreeze(habit.id, todayKey)
    if (ok) {
      if (!frozen) toast.success("День заморожен — пропуск не разорвёт серию")
    } else if (locked) {
      toast.error("Заморозки заблокированы — снять нельзя до окончания срока")
    } else {
      toast.error(`Лимит заморозок на месяц исчерпан (${limit})`)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Snowflake className="size-3.5 text-blue-500" />
        {locked
          ? "Заморозки заблокированы"
          : `Заморозки в этом месяце: ${left} из ${limit}`}
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onClick}
        disabled={(!frozen && left === 0) || (!frozen && locked)}
        className={cn(
          "border-blue-500/40 text-blue-600 hover:bg-blue-500/10 hover:text-blue-600 dark:text-blue-400",
          frozen && "bg-blue-500/15"
        )}
      >
        <Snowflake className="size-4" />
        {frozen ? "Разморозить" : "Заморозить день"}
      </Button>
    </div>
  )
}

function NoteField({ habitId }: { habitId: string }) {
  const todayKey = dateKey()
  useNotes() // ре-рендер при внешней смене заметок
  const [text, setText] = useState(() => getNote(habitId, todayKey))

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="habit-note">Заметка на сегодня</Label>
      <Textarea
        id="habit-note"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, NOTE_MAX))}
        onBlur={() => setNote(habitId, todayKey, text)}
        maxLength={NOTE_MAX}
        placeholder="Как прошло? Причина пропуска, комментарий…"
        rows={2}
      />
      <span className="text-muted-foreground self-end text-xs tabular-nums">
        {text.length}/{NOTE_MAX}
      </span>
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

        <FreezeControl habit={habit} />

        <NoteField habitId={habit.id} />

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
