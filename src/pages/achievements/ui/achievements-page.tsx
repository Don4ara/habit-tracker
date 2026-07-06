import {
  Award,
  CalendarCheck,
  CalendarClock,
  Crown,
  Flame,
  Gem,
  Layers,
  Medal,
  Mountain,
  Rocket,
  Shapes,
  Sparkles,
  Star,
  Sunrise,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react"
import { useMemo, type ReactNode } from "react"

import {
  useHabits,
  useCompletions,
  bestStreak,
  totalCompletions,
  dayRatio,
} from "@/entities/habit"
import { PageBody, PageHeader } from "@/widgets/page-header"
import { cn } from "@/shared/lib/utils"

type Metric =
  | "habits"
  | "streak"
  | "total"
  | "perfect"
  | "activeDays"
  | "categories"

interface AchievementDef {
  id: string
  title: string
  description: string
  icon: ReactNode
  goal: number
  metric: Metric
}

const DEFS: AchievementDef[] = [
  // Количество привычек
  { id: "first", title: "Первый шаг", description: "Создать первую привычку", icon: <Sparkles className="size-5" />, goal: 1, metric: "habits" },
  { id: "collector", title: "Коллекционер", description: "5 привычек одновременно", icon: <Star className="size-5" />, goal: 5, metric: "habits" },
  { id: "library", title: "Библиотека", description: "10 привычек одновременно", icon: <Layers className="size-5" />, goal: 10, metric: "habits" },
  { id: "versatile", title: "Разносторонний", description: "Привычки в 3 категориях", icon: <Shapes className="size-5" />, goal: 3, metric: "categories" },

  // Серии
  { id: "warmup", title: "Разогрев", description: "Серия из 3 дней", icon: <Flame className="size-5" />, goal: 3, metric: "streak" },
  { id: "week", title: "Неделя силы", description: "Серия из 7 дней", icon: <Zap className="size-5" />, goal: 7, metric: "streak" },
  { id: "twoweeks", title: "Две недели", description: "Серия из 14 дней", icon: <TrendingUp className="size-5" />, goal: 14, metric: "streak" },
  { id: "iron", title: "Железная воля", description: "Серия из 30 дней", icon: <Medal className="size-5" />, goal: 30, metric: "streak" },
  { id: "twomonths", title: "Несокрушимый", description: "Серия из 60 дней", icon: <Mountain className="size-5" />, goal: 60, metric: "streak" },
  { id: "century_streak", title: "Сто дней подряд", description: "Серия из 100 дней", icon: <Crown className="size-5" />, goal: 100, metric: "streak" },

  // Всего отметок
  { id: "ten", title: "Первая десятка", description: "10 отметок выполнения", icon: <Rocket className="size-5" />, goal: 10, metric: "total" },
  { id: "hundred", title: "Сотня", description: "100 отметок выполнения", icon: <Target className="size-5" />, goal: 100, metric: "total" },
  { id: "quarter", title: "Четверть тысячи", description: "250 отметок выполнения", icon: <Award className="size-5" />, goal: 250, metric: "total" },
  { id: "marathon", title: "Марафон", description: "500 отметок выполнения", icon: <Trophy className="size-5" />, goal: 500, metric: "total" },
  { id: "legend", title: "Легенда", description: "1000 отметок выполнения", icon: <Gem className="size-5" />, goal: 1000, metric: "total" },

  // Идеальный день + активность
  { id: "perfect", title: "Идеальный день", description: "Выполнить всё за день", icon: <Sunrise className="size-5" />, goal: 1, metric: "perfect" },
  { id: "month_active", title: "Месяц в деле", description: "30 активных дней", icon: <CalendarCheck className="size-5" />, goal: 30, metric: "activeDays" },
  { id: "hundred_days", title: "Постоянство", description: "100 активных дней", icon: <CalendarClock className="size-5" />, goal: 100, metric: "activeDays" },
]

export function AchievementsPage() {
  const habits = useHabits()
  const completions = useCompletions()

  const total = totalCompletions(completions)

  // Тяжёлые серии/агрегаты — пересчёт только при смене данных.
  const { maxStreak, activeDays, categories } = useMemo(
    () => ({
      maxStreak: habits.reduce((m, h) => Math.max(m, bestStreak(h, completions)), 0),
      activeDays: new Set(Object.values(completions).flat()).size,
      categories: new Set(habits.map((h) => h.category)).size,
    }),
    [habits, completions]
  )
  const todayRatio = dayRatio(habits, completions, new Date())

  const metrics: Record<Metric, number> = {
    habits: habits.length,
    streak: maxStreak,
    total,
    perfect: todayRatio === 1 ? 1 : 0,
    activeDays,
    categories,
  }

  const progressFor = (d: AchievementDef) => metrics[d.metric]

  const unlocked = DEFS.filter((d) => progressFor(d) >= d.goal).length

  // Геймификация: 25 отметок = 1 уровень.
  const PER_LEVEL = 25
  const level = Math.floor(total / PER_LEVEL) + 1
  const intoLevel = total % PER_LEVEL

  return (
    <>
      <PageHeader title="Достижения" />
      <PageBody>
        <div className="flex items-center gap-4 rounded-xl border p-4">
          <div className="bg-primary text-primary-foreground font-heading grid size-14 shrink-0 place-content-center rounded-xl text-xl font-semibold tabular-nums">
            {level}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">Уровень {level}</div>
            <div className="text-muted-foreground text-xs">
              До следующего: {PER_LEVEL - intoLevel} отметок
            </div>
            <div className="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-[width] duration-500"
                style={{ width: `${(intoLevel / PER_LEVEL) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight">
              Получено {unlocked} из {DEFS.length}
            </h2>
            <p className="text-muted-foreground text-sm">
              Отмечайте привычки, чтобы открывать награды.
            </p>
          </div>
          <Trophy className="text-muted-foreground size-8" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {DEFS.map((d) => {
            const progress = Math.min(progressFor(d), d.goal)
            const done = progress >= d.goal
            return (
              <div
                key={d.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 transition-colors",
                  done ? "border-success/40 bg-success/10" : "opacity-80"
                )}
              >
                <div
                  className={cn(
                    "grid size-11 shrink-0 place-content-center rounded-lg",
                    done
                      ? "bg-success text-success-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {d.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{d.title}</div>
                  <div className="text-muted-foreground text-xs">
                    {d.description}
                  </div>
                  {!done && d.goal > 1 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${(progress / d.goal) * 100}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground text-[10px] tabular-nums">
                        {progress}/{d.goal}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </PageBody>
    </>
  )
}
