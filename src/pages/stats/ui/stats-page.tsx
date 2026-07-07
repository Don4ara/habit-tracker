import { useMemo } from "react"
import { BarChart3, CheckCircle2, Flame, Target } from "lucide-react"

import {
  useHabits,
  useCompletions,
  getStreak,
  completionRate,
  habitRate,
  totalCompletions,
} from "@/entities/habit"
import { ActivityChart } from "@/widgets/activity-chart"
import { PageBody, PageHeader } from "@/widgets/page-header"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty"

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
    <div className="flex flex-col gap-2 rounded-xl border p-4">
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

export function StatsPage() {
  const habits = useHabits()
  const completions = useCompletions()

  const total = totalCompletions(completions)

  // Тяжёлые агрегаты — пересчёт только при смене данных.
  const { rate30, bestStreak, perHabit } = useMemo(
    () => ({
      rate30: completionRate(habits, completions, 30),
      bestStreak: habits.reduce((m, h) => Math.max(m, getStreak(h)), 0),
      perHabit: habits.map((h) => ({
        habit: h,
        rate: habitRate(h, completions, 30),
        streak: getStreak(h),
      })),
    }),
    [habits, completions]
  )

  return (
    <>
      <PageHeader title="Статистика" />
      <PageBody>
        {habits.length === 0 ? (
          <Empty className="min-h-[60vh]">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BarChart3 />
              </EmptyMedia>
              <EmptyTitle>Пока нет данных</EmptyTitle>
              <EmptyDescription>
                Создайте привычки и отмечайте их — статистика появится здесь.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={<Target className="size-4" />}
                label="Выполнение"
                value={`${Math.round(rate30 * 100)}%`}
                hint="за 30 дней"
              />
              <StatCard
                icon={<CheckCircle2 className="size-4" />}
                label="Всего отметок"
                value={total}
                hint="за всё время"
              />
              <StatCard
                icon={<Flame className="size-4" />}
                label="Лучшая серия"
                value={bestStreak}
                hint="дней подряд"
              />
              <StatCard
                icon={<BarChart3 className="size-4" />}
                label="Привычек"
                value={habits.length}
                hint="активных"
              />
            </div>

            {/* Активность */}
            <ActivityChart />

            {/* По привычкам */}
            <div className="flex flex-col gap-3">
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                По привычкам
              </h2>
              <div className="flex flex-col gap-2">
                {perHabit.map(({ habit: h, rate, streak }) => {
                  return (
                    <div key={h.id} className="rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-8 shrink-0 place-content-center rounded-md bg-muted text-base">
                          {h.icon || h.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1 truncate text-sm font-medium">
                          {h.name}
                        </div>
                        <span className="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
                          <Flame className="size-3.5" />
                          {streak}
                        </span>
                        <span className="w-10 text-right text-sm tabular-nums">
                          {Math.round(rate * 100)}%
                        </span>
                      </div>
                      <div className="bg-muted mt-2 h-1.5 w-full overflow-hidden rounded-full">
                        <div
                          className="bg-primary h-full rounded-full transition-[width] duration-500"
                          style={{ width: `${rate * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </PageBody>
    </>
  )
}
