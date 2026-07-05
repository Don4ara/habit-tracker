import { useState } from "react"
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  Flame,
  ListFilter,
  ListTodo,
  Pencil,
  Target,
  Trash2,
} from "lucide-react"

import {
  useHabits,
  useAllHabits,
  useCompletions,
  toggleCompletion,
  removeHabit,
  setArchived,
  getStreak,
  dateKey,
  weekDayOf,
  type Habit,
  type WeekDay,
} from "@/entities/habit"
import { CreateHabitDialog } from "@/features/create-habit"
import { HabitDetailDialog } from "@/features/habit-detail"
import { Button } from "@/shared/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Checkbox } from "@/shared/ui/checkbox"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty"
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

/** Понедельник текущей недели. */
function startOfWeek(base = new Date()): Date {
  const d = new Date(base)
  const offset = (d.getDay() + 6) % 7 // 0 = понедельник
  d.setDate(d.getDate() - offset)
  d.setHours(0, 0, 0, 0)
  return d
}

function ProgressRing({ value }: { value: number }) {
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 64 64" className="size-16 -rotate-90" aria-hidden>
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        strokeWidth="6"
        className="stroke-muted"
      />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - value)}
        className="stroke-primary transition-[stroke-dashoffset] duration-500 ease-out"
      />
    </svg>
  )
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        {icon}
        {label}
      </div>
      <div className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </div>
      {hint && <div className="text-muted-foreground text-xs">{hint}</div>}
    </div>
  )
}

function HabitActions({ habit }: { habit: Habit }) {
  return (
    <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
      {habit.archived ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Вернуть привычку ${habit.name}`}
          className="text-muted-foreground"
          onClick={() => setArchived(habit.id, false)}
        >
          <ArchiveRestore className="size-4" />
        </Button>
      ) : (
        <>
          <CreateHabitDialog
            habit={habit}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Изменить привычку ${habit.name}`}
                className="text-muted-foreground"
              >
                <Pencil className="size-4" />
              </Button>
            }
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`В архив ${habit.name}`}
            className="text-muted-foreground"
            onClick={() => setArchived(habit.id, true)}
          >
            <Archive className="size-4" />
          </Button>
        </>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Удалить привычку ${habit.name}`}
        className="text-muted-foreground"
        onClick={() => removeHabit(habit.id)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  )
}

function HabitRow({
  habit,
  todayKey,
}: {
  habit: Habit
  todayKey: string
}) {
  const isDoneToday = useCompletions()[habit.id]?.includes(todayKey) ?? false
  const streak = getStreak(habit)
  const cbId = `habit-${habit.id}`

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border p-3 transition-colors",
        isDoneToday ? "bg-muted/40" : "hover:bg-muted/50"
      )}
    >
      <Checkbox
        id={cbId}
        checked={isDoneToday}
        onCheckedChange={() => toggleCompletion(habit.id, todayKey)}
        className="size-5"
      />
      <HabitDetailDialog
        habit={habit}
        trigger={
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <span className="grid size-9 shrink-0 place-content-center rounded-md bg-muted text-lg">
              {habit.icon || habit.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "truncate text-sm font-medium",
                  isDoneToday && "text-muted-foreground line-through"
                )}
              >
                {habit.name}
              </div>
              <div className="text-muted-foreground truncate text-xs">
                {habit.category}
              </div>
            </div>
          </button>
        }
      />
      {streak > 0 && (
        <span className="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
          <Flame className="size-3.5" />
          {streak}
        </span>
      )}
      <HabitActions habit={habit} />
    </div>
  )
}

function daysSummary(habit: Habit): string {
  if (habit.days.length === 7) return "Каждый день"
  return WEEK.filter((w) => habit.days.includes(w.id))
    .map((w) => w.label)
    .join(", ")
}

function ManageRow({ habit }: { habit: Habit }) {
  return (
    <div className="group flex items-center gap-3 rounded-lg border p-3">
      <HabitDetailDialog
        habit={habit}
        trigger={
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-content-center rounded-md bg-muted text-lg",
                habit.archived && "opacity-60"
              )}
            >
              {habit.icon || habit.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "truncate text-sm font-medium",
                  habit.archived && "text-muted-foreground"
                )}
              >
                {habit.name}
              </div>
              <div className="text-muted-foreground truncate text-xs">
                {habit.category} · {daysSummary(habit)}
              </div>
            </div>
          </button>
        }
      />
      <HabitActions habit={habit} />
    </div>
  )
}

export function HabitsList() {
  const habits = useAllHabits()
  const [category, setCategory] = useState<string | null>(null)
  const active = habits.filter((h) => !h.archived)
  const archived = habits.filter((h) => h.archived)
  const categories = [...new Set(active.map((h) => h.category))]
  const filtered = category
    ? active.filter((h) => h.category === category)
    : active

  if (habits.length === 0) {
    return (
      <Empty className="min-h-[60vh]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ListTodo />
          </EmptyMedia>
          <EmptyTitle>Пока нет привычек</EmptyTitle>
          <EmptyDescription>
            Создайте первую привычку — она появится в этом списке.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CreateHabitDialog trigger={<Button>Создать привычку</Button>} />
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold tracking-tight">
          Список привычек
        </h2>

        {categories.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ListFilter className="size-4" />
                {category ?? "Все категории"}
                <ChevronDown className="size-4 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuRadioGroup
                value={category ?? "__all"}
                onValueChange={(v) => setCategory(v === "__all" ? null : v)}
              >
                <DropdownMenuRadioItem value="__all">
                  Все категории
                </DropdownMenuRadioItem>
                {categories.map((c) => (
                  <DropdownMenuRadioItem key={c} value={c}>
                    {c}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {filtered.length === 0 && (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          Нет привычек в категории «{category}».
        </p>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map((h) => (
          <ManageRow key={h.id} habit={h} />
        ))}
      </div>

      {archived.length > 0 && (
        <details className="mt-2">
          <summary className="text-muted-foreground cursor-pointer text-sm">
            Архив ({archived.length})
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            {archived.map((h) => (
              <ManageRow key={h.id} habit={h} />
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

export function HabitsBoard() {
  const habits = useHabits()
  const allHabits = useAllHabits()
  const completions = useCompletions()
  const todayKey = dateKey()
  const todayWd = weekDayOf(new Date())

  const isDoneOn = (id: string, key: string) =>
    completions[id]?.includes(key) ?? false

  const todayHabits = habits.filter((h) => h.days.includes(todayWd))
  const doneToday = todayHabits.filter((h) => isDoneOn(h.id, todayKey)).length
  const ratio = todayHabits.length ? doneToday / todayHabits.length : 0
  const bestStreak = habits.reduce((m, h) => Math.max(m, getStreak(h)), 0)

  // Прогресс по дням текущей недели: выполнено / запланировано.
  const weekStart = startOfWeek()
  const weekProgress = WEEK.map((wd, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    const key = dateKey(d)
    const scheduled = habits.filter((h) => h.days.includes(wd.id))
    const doneCount = scheduled.filter((h) => isDoneOn(h.id, key)).length
    return {
      ...wd,
      ratio: scheduled.length ? doneCount / scheduled.length : 0,
      hasScheduled: scheduled.length > 0,
      isToday: wd.id === todayWd,
    }
  })

  if (allHabits.length === 0) {
    return (
      <Empty className="min-h-[60vh]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ListTodo />
          </EmptyMedia>
          <EmptyTitle>Пока нет привычек</EmptyTitle>
          <EmptyDescription>
            Создайте первую привычку и начните отмечать её каждый день.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CreateHabitDialog trigger={<Button>Создать привычку</Button>} />
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Обзор */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border p-4">
          <div className="relative">
            <ProgressRing value={ratio} />
            <span className="absolute inset-0 grid place-content-center text-sm font-semibold tabular-nums">
              {Math.round(ratio * 100)}%
            </span>
          </div>
          <div>
            <div className="text-muted-foreground text-sm">Сегодня</div>
            <div className="font-heading text-2xl font-semibold tabular-nums">
              {doneToday}/{todayHabits.length}
            </div>
            <div className="text-muted-foreground text-xs">
              привычек выполнено
            </div>
          </div>
        </div>
        <StatCard
          icon={<Flame className="size-4" />}
          label="Лучшая серия"
          value={<span className="tabular-nums">{bestStreak}</span>}
          hint="дней подряд"
        />
        <StatCard
          icon={<Target className="size-4" />}
          label="Всего привычек"
          value={<span className="tabular-nums">{habits.length}</span>}
          hint={`${todayHabits.length} на сегодня`}
        />
      </div>

      {/* Неделя */}
      <div className="grid grid-cols-7 gap-2 rounded-xl border p-4">
        {weekProgress.map((d) => (
          <div key={d.id} className="flex flex-col items-center gap-2">
            <span
              className={cn(
                "text-xs",
                d.isToday
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              {d.label}
            </span>
            <span
              className={cn(
                "grid size-8 place-content-center rounded-full text-xs tabular-nums transition-colors",
                !d.hasScheduled && "bg-muted/40 text-muted-foreground",
                d.hasScheduled && d.ratio === 1 && "bg-primary text-primary-foreground",
                d.hasScheduled && d.ratio > 0 && d.ratio < 1 && "bg-muted text-foreground",
                d.hasScheduled && d.ratio === 0 && "border text-muted-foreground",
                d.isToday && "ring-primary ring-2 ring-offset-2 ring-offset-background"
              )}
            >
              {d.hasScheduled ? Math.round(d.ratio * 100) : "—"}
            </span>
          </div>
        ))}
      </div>

      {/* Сегодня */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            На сегодня
          </h2>
          <span className="text-muted-foreground text-sm tabular-nums">
            {doneToday}/{todayHabits.length}
          </span>
        </div>
        {todayHabits.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
            На сегодня привычек не запланировано. Отдыхайте.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {todayHabits.map((h) => (
              <HabitRow key={h.id} habit={h} todayKey={todayKey} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
