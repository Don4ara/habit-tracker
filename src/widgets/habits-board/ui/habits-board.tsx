import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import confetti from "canvas-confetti"
import { toast } from "sonner"
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  EllipsisVertical,
  Flame,
  ListFilter,
  ListTodo,
  Pencil,
  Search,
  Sparkles,
  Swords,
  Trash2,
} from "lucide-react"

import {
  useHabits,
  useAllHabits,
  useCompletions,
  toggleCompletion,
  removeHabit,
  restoreHabit,
  setArchived,
  getStreak,
  isFrozen,
  useFreezes,
  dateKey,
  weekDayOf,
  activeOn,
  type Habit,
  type WeekDay,
} from "@/entities/habit"
import { useChallenges } from "@/entities/challenge"
import { CreateHabitDialog } from "@/features/create-habit"
import { HabitDetailDialog } from "@/features/habit-detail"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
        className="stroke-success transition-[stroke-dashoffset] duration-500 ease-out"
      />
    </svg>
  )
}

function MiniStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: React.ReactNode
  label: string
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <span className="font-heading text-lg font-semibold tabular-nums leading-none">
        {value}
      </span>
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  )
}

// Строка мотивации под прогрессом — зависит от доли выполнения.
function progressMessage(done: number, total: number): string {
  if (total === 0) return "На сегодня привычек не запланировано"
  if (done === 0) return "Начните день с первой отметки"
  if (done === total) return "Идеальный день. Все привычки выполнены"
  if (done / total >= 0.5) return "Больше половины позади, дожимайте"
  return "Хорошее начало, продолжайте"
}

function HabitActions({ habit }: { habit: Habit }) {
  const [editOpen, setEditOpen] = useState(false)
  const archived = habit.archived

  const del = () => {
    const snap = removeHabit(habit.id)
    if (snap)
      toast(`Привычка «${habit.name}» удалена`, {
        action: { label: "Отменить", onClick: () => restoreHabit(snap) },
      })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Действия: ${habit.name}`}
            className="text-muted-foreground shrink-0"
          >
            <EllipsisVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!archived && (
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Изменить
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setArchived(habit.id, !archived)}>
            {archived ? (
              <>
                <ArchiveRestore className="size-4" />
                Вернуть из архива
              </>
            ) : (
              <>
                <Archive className="size-4" />
                В архив
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={del}
          >
            <Trash2 className="size-4" />
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {!archived && (
        <CreateHabitDialog
          habit={habit}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </>
  )
}

function HabitRow({
  habit,
  todayKey,
  isChallenge = false,
}: {
  habit: Habit
  todayKey: string
  isChallenge?: boolean
}) {
  const habitDone = useCompletions()[habit.id]
  const isDoneToday = habitDone?.includes(todayKey) ?? false
  useFreezes() // ре-рендер при смене заморозок
  const frozen = isFrozen(habit.id, todayKey)
  const frozenOnly = frozen && !isDoneToday // заморожен, но не отмечен
  const shownDone = isDoneToday || frozen
  // habitDone в deps намеренно: getStreak читает глобальные отметки.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const streak = useMemo(() => getStreak(habit), [habit, habitDone])
  const cbId = `habit-${habit.id}`

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border p-3 transition-colors",
        // Челлендж — золотой, приоритетнее обычных состояний.
        isChallenge
          ? "border-amber-400/50 bg-amber-400/5"
          : frozenOnly
            ? "border-blue-500/50 bg-blue-500/5"
            : isDoneToday
              ? "bg-muted/40"
              : "hover:bg-muted/50"
      )}
    >
      <Checkbox
        id={cbId}
        checked={shownDone}
        onCheckedChange={() => toggleCompletion(habit.id, todayKey)}
        className={cn(
          "size-5",
          isChallenge &&
            "border-amber-400 data-[state=checked]:border-amber-400 data-[state=checked]:bg-amber-400 data-[state=checked]:text-white",
          frozenOnly &&
            "border-blue-500 text-white data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white"
        )}
      />
      <HabitDetailDialog
        habit={habit}
        trigger={
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-content-center rounded-md text-lg",
                isChallenge
                  ? "bg-amber-400/20 text-amber-600 dark:text-amber-400"
                  : "bg-muted"
              )}
            >
              {habit.icon || habit.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "flex items-center gap-1.5 truncate text-sm font-medium",
                  shownDone && "text-muted-foreground line-through"
                )}
              >
                {habit.name}
                {isChallenge && (
                  <Swords className="size-3.5 shrink-0 text-amber-500" />
                )}
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
  // Фильтр категории живёт в URL — сайдбар навигирует сюда с ?category=…
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get("category")
  const setCategory = (c: string | null) =>
    setSearchParams(
      (prev) => {
        if (c) prev.set("category", c)
        else prev.delete("category")
        return prev
      },
      { replace: true }
    )
  const [query, setQuery] = useState("")
  const active = habits.filter((h) => !h.archived)
  const archived = habits.filter((h) => h.archived)
  const categories = [...new Set(active.map((h) => h.category))]
  const q = query.trim().toLowerCase()
  const filtered = active.filter(
    (h) =>
      (!category || h.category === category) &&
      (!q || h.name.toLowerCase().includes(q))
  )

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

      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск привычки"
          className="pl-9"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
          Ничего не найдено. Измените запрос или фильтр.
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
  const challenges = useChallenges()
  const challengeIds = new Set(challenges.map((c) => c.habitId))
  const todayKey = dateKey()
  const todayWd = weekDayOf(new Date())

  const isDoneOn = (id: string, key: string) =>
    completions[id]?.includes(key) ?? false

  const todayHabits = useMemo(
    () => habits.filter((h) => h.days.includes(todayWd)),
    [habits, todayWd]
  )
  const doneToday = todayHabits.filter((h) => isDoneOn(h.id, todayKey)).length
  const ratio = todayHabits.length ? doneToday / todayHabits.length : 0

  // «Привычка дня» — запланированная на сегодня, детерминированно по дате.
  // Выполнил текущую — сразу показываем следующую невыполненную для быстрой отметки.
  const habitOfDay = useMemo(() => {
    if (todayHabits.length === 0) return null
    let hash = 0
    for (const ch of todayKey) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
    const start = hash % todayHabits.length
    for (let i = 0; i < todayHabits.length; i++) {
      const h = todayHabits[(start + i) % todayHabits.length]
      if (!isDoneOn(h.id, todayKey)) return h
    }
    return todayHabits[start] // все выполнены
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayHabits, todayKey, completions])

  // Тяжёлые расчёты серий и недели — пересчёт только при смене данных.
  const bestStreak = useMemo(
    () => habits.reduce((m, h) => Math.max(m, getStreak(h)), 0),
    // completions намеренно: getStreak читает глобальные отметки.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [habits, completions]
  )

  const weekProgress = useMemo(() => {
    const weekStart = startOfWeek()
    return WEEK.map((wd, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      const key = dateKey(d)
      const scheduled = habits.filter((h) => activeOn(h, d))
      const doneCount = scheduled.filter(
        (h) => completions[h.id]?.includes(key) ?? false
      ).length
      return {
        ...wd,
        ratio: scheduled.length ? doneCount / scheduled.length : 0,
        hasScheduled: scheduled.length > 0,
        isToday: wd.id === todayWd,
      }
    })
    // todayKey намеренно: форсирует пересчёт при смене суток.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits, completions, todayKey, todayWd])

  // Празднуем идеальный день один раз за сутки (не при каждом перещёлкивании).
  const allDone = todayHabits.length > 0 && doneToday === todayHabits.length
  useEffect(() => {
    if (!allDone) return
    const key = `celebrated-${todayKey}`
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, "1")
    toast.success("Идеальный день! Все привычки на сегодня выполнены")
    // Конфети из двух нижних углов — один раз за сутки.
    const opts = { spread: 70, startVelocity: 45, particleCount: 80, zIndex: 100 }
    confetti({ ...opts, origin: { x: 0, y: 1 }, angle: 60 })
    confetti({ ...opts, origin: { x: 1, y: 1 }, angle: 120 })
  }, [allDone, todayKey])

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
      {/* Привычка дня / похвала за идеальный день */}
      {allDone ? (
        <div className="flex items-center gap-4 rounded-2xl border border-success/40 bg-success/10 p-5">
          <span className="grid size-12 shrink-0 place-content-center rounded-xl bg-success/20 text-2xl">
            🎉
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-success flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
              <Sparkles className="size-3.5" />
              Идеальный день
            </div>
            <div className="font-heading text-lg font-semibold">
              Ты большой молодец!
            </div>
            <div className="text-muted-foreground truncate text-sm">
              Все привычки на сегодня выполнены — так держать!
            </div>
          </div>
        </div>
      ) : (
        habitOfDay && (
          <div className="flex items-center gap-4 rounded-2xl border bg-primary/5 p-5">
            <span className="grid size-12 shrink-0 place-content-center rounded-xl bg-primary/10 text-2xl">
              {habitOfDay.icon || habitOfDay.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-primary flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
                <Sparkles className="size-3.5" />
                Привычка дня
              </div>
              <div className="font-heading truncate text-lg font-semibold">
                {habitOfDay.name}
              </div>
              <div className="text-muted-foreground truncate text-sm">
                {habitOfDay.category}
              </div>
            </div>
            <Button
              variant="default"
              onClick={() => toggleCompletion(habitOfDay.id, todayKey)}
            >
              Отметить
            </Button>
          </div>
        )
      )}

      {/* Обзор дня */}
      <div className="flex flex-col gap-5 rounded-2xl border p-5 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative shrink-0 self-start sm:self-center">
          <ProgressRing value={ratio} />
          <span className="absolute inset-0 grid place-content-center text-sm font-semibold tabular-nums">
            {Math.round(ratio * 100)}%
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Сегодня
          </div>
          <div className="font-heading text-3xl font-semibold tabular-nums">
            {doneToday}
            <span className="text-muted-foreground text-xl">
              /{todayHabits.length}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm text-balance">
            {progressMessage(doneToday, todayHabits.length)}
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t pt-4">
            <MiniStat
              icon={<Flame className="size-4" />}
              value={bestStreak}
              label="серия"
            />
            <MiniStat
              icon={<Sparkles className="size-4" />}
              value={habits.length}
              label="привычек"
            />
          </div>
        </div>
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
                d.hasScheduled && d.ratio === 1 && "bg-success text-success-foreground",
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
              <HabitRow
                key={h.id}
                habit={h}
                todayKey={todayKey}
                isChallenge={challengeIds.has(h.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
