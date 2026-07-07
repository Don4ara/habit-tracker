import { dateKey, weekDayOf } from "../model/store"
import type { Habit } from "../model/types"

type Completions = Record<string, string[]>

/** Привычки, запланированные на конкретную дату. */
export function scheduledOn(habits: Habit[], date: Date): Habit[] {
  const wd = weekDayOf(date)
  return habits.filter((h) => h.days.includes(wd))
}

/** Доля выполнения за конкретный день: done / scheduled (0..1, null — нечего было делать). */
export function dayRatio(
  habits: Habit[],
  completions: Completions,
  date: Date
): number | null {
  const scheduled = scheduledOn(habits, date)
  if (scheduled.length === 0) return null
  const key = dateKey(date)
  const done = scheduled.filter((h) => completions[h.id]?.includes(key)).length
  return done / scheduled.length
}

/** Средняя доля выполнения за последние `days` дней по всем привычкам. */
export function completionRate(
  habits: Habit[],
  completions: Completions,
  days: number
): number {
  let done = 0
  let total = 0
  const d = new Date()
  for (let i = 0; i < days; i++) {
    const wd = weekDayOf(d)
    const key = dateKey(d)
    for (const h of habits) {
      if (h.days.includes(wd)) {
        total++
        if (completions[h.id]?.includes(key)) done++
      }
    }
    d.setDate(d.getDate() - 1)
  }
  return total ? done / total : 0
}

/** Доля выполнения одной привычки за последние `days` дней. */
export function habitRate(
  habit: Habit,
  completions: Completions,
  days: number
): number {
  if (habit.days.length === 0) return 0
  let done = 0
  let total = 0
  const d = new Date()
  for (let i = 0; i < days; i++) {
    if (habit.days.includes(weekDayOf(d))) {
      total++
      if (completions[habit.id]?.includes(dateKey(d))) done++
    }
    d.setDate(d.getDate() - 1)
  }
  return total ? done / total : 0
}

/** Всего отметок выполнения за всё время. */
export function totalCompletions(completions: Completions): number {
  return Object.values(completions).reduce((s, arr) => s + arr.length, 0)
}

/** Самая длинная серия за всё время (окно — до 2 лет назад). */
export function bestStreak(
  habit: Habit,
  completions: Completions,
  lookbackDays = 730
): number {
  if (habit.days.length === 0) return 0
  const done = new Set(completions[habit.id] ?? [])
  const d = new Date()
  d.setDate(d.getDate() - (lookbackDays - 1))
  let best = 0
  let run = 0
  for (let i = 0; i < lookbackDays; i++) {
    if (habit.days.includes(weekDayOf(d))) {
      if (done.has(dateKey(d))) {
        run++
        best = Math.max(best, run)
      } else {
        run = 0
      }
    }
    d.setDate(d.getDate() + 1)
  }
  return best
}

interface HeatCell {
  key: string
  scheduled: boolean
  done: boolean
  future: boolean
}

/** Тепловая карта одной привычки за `weeks` недель: колонки-недели, Пн сверху. */
export function habitHeatmap(
  habit: Habit,
  completions: Completions,
  weeks = 12
): HeatCell[] {
  const done = new Set(completions[habit.id] ?? [])
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(today)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7)) // понедельник
  start.setDate(start.getDate() - (weeks - 1) * 7)

  const cells: HeatCell[] = []
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = dateKey(d)
    cells.push({
      key,
      scheduled: habit.days.includes(weekDayOf(d)),
      done: done.has(key),
      future: d > today,
    })
  }
  return cells
}

/** По дням за последние `days`: выполнено и запланировано (старые → новые). */
export function dailySeries(
  habits: Habit[],
  completions: Completions,
  days: number
): { date: string; done: number; scheduled: number }[] {
  const out: { date: string; done: number; scheduled: number }[] = []
  const d = new Date()
  d.setDate(d.getDate() - (days - 1))
  for (let i = 0; i < days; i++) {
    const key = dateKey(d)
    const wd = weekDayOf(d)
    let scheduled = 0
    let done = 0
    for (const h of habits) {
      if (h.days.includes(wd)) {
        scheduled++
        if (completions[h.id]?.includes(key)) done++
      }
    }
    out.push({ date: key, done, scheduled })
    d.setDate(d.getDate() + 1)
  }
  return out
}

/** Количество выполненных отметок за каждый из последних `days` дней (старые → новые). */
export function dailyCounts(
  completions: Completions,
  days: number
): { key: string; count: number }[] {
  const out: { key: string; count: number }[] = []
  const d = new Date()
  d.setDate(d.getDate() - (days - 1))
  for (let i = 0; i < days; i++) {
    const key = dateKey(d)
    const count = Object.values(completions).filter((arr) =>
      arr.includes(key)
    ).length
    out.push({ key, count })
    d.setDate(d.getDate() + 1)
  }
  return out
}
