import { useSyncExternalStore } from "react"

import {
  getActiveWorkspaceId,
  subscribeActiveWorkspace,
} from "@/entities/workspace"

import type { Habit, WeekDay } from "./types"

// Данные хранятся по пространствам: `habits:<wsId>` и `habit-completions:<wsId>`.
const hKey = () => `habits:${getActiveWorkspaceId()}`
const cKey = () => `habit-completions:${getActiveWorkspaceId()}`

// Разовая миграция старых глобальных ключей в пространство "personal".
function migrateLegacy() {
  const legacy = localStorage.getItem("habits")
  if (legacy !== null && localStorage.getItem("habits:personal") === null) {
    localStorage.setItem("habits:personal", legacy)
    const lc = localStorage.getItem("habit-completions")
    if (lc !== null) localStorage.setItem("habit-completions:personal", lc)
    localStorage.removeItem("habits")
    localStorage.removeItem("habit-completions")
  }
}
migrateLegacy()

let habits: Habit[] = load()
let completions: Record<string, string[]> = loadCompletions()
// Кэш активных (неархивных) привычек — стабильная ссылка для useSyncExternalStore.
let activeHabits: Habit[] = computeActive()
const listeners = new Set<() => void>()

function computeActive(): Habit[] {
  return habits.filter((h) => !h.archived)
}

// Смена активного пространства — перечитать данные и уведомить подписчиков.
subscribeActiveWorkspace(() => {
  habits = load()
  completions = loadCompletions()
  activeHabits = computeActive()
  notify()
})

function load(): Habit[] {
  try {
    return JSON.parse(localStorage.getItem(hKey()) ?? "[]")
  } catch {
    return []
  }
}

function loadCompletions(): Record<string, string[]> {
  try {
    return JSON.parse(localStorage.getItem(cKey()) ?? "{}")
  } catch {
    return {}
  }
}

function notify() {
  listeners.forEach((l) => l())
}

function emit() {
  activeHabits = computeActive()
  localStorage.setItem(hKey(), JSON.stringify(habits))
  notify()
}

function emitCompletions() {
  localStorage.setItem(cKey(), JSON.stringify(completions))
  notify()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Только активные (неархивные) привычки. */
export function useHabits(): Habit[] {
  return useSyncExternalStore(subscribe, () => activeHabits)
}

/** Все привычки, включая архив. */
export function useAllHabits(): Habit[] {
  return useSyncExternalStore(subscribe, () => habits)
}

export function useCompletions(): Record<string, string[]> {
  return useSyncExternalStore(subscribe, () => completions)
}

export function setArchived(id: string, archived: boolean) {
  habits = habits.map((h) => (h.id === id ? { ...h, archived } : h))
  emit()
}

// ponytail: randomUUID недоступен вне secure context (http по IP) — фолбэк на timestamp+random
const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2)

/** Возвращает false, если привычка с таким названием уже существует. */
export function addHabit(data: Omit<Habit, "id" | "createdAt">): boolean {
  const name = data.name.trim().toLowerCase()
  if (habits.some((h) => h.name.trim().toLowerCase() === name)) return false
  habits = [
    ...habits,
    { ...data, id: genId(), createdAt: new Date().toISOString() },
  ]
  emit()
  return true
}

/** Обновляет привычку. false — если новое имя занято другой привычкой. */
export function updateHabit(
  id: string,
  data: Omit<Habit, "id" | "createdAt">
): boolean {
  const name = data.name.trim().toLowerCase()
  if (habits.some((h) => h.id !== id && h.name.trim().toLowerCase() === name))
    return false
  habits = habits.map((h) => (h.id === id ? { ...h, ...data } : h))
  emit()
  return true
}

export interface HabitSnapshot {
  habit: Habit
  completions: string[]
  index: number
}

/** Удаляет привычку, возвращает снапшот для отмены (или null). */
export function removeHabit(id: string): HabitSnapshot | null {
  const index = habits.findIndex((h) => h.id === id)
  if (index === -1) return null
  const habit = habits[index]
  const habitCompletions = completions[id] ?? []
  habits = habits.filter((h) => h.id !== id)
  const rest = { ...completions }
  delete rest[id]
  completions = rest
  emit()
  emitCompletions()
  return { habit, completions: habitCompletions, index }
}

/** Восстанавливает удалённую привычку на прежнее место. */
export function restoreHabit(snap: HabitSnapshot) {
  if (habits.some((h) => h.id === snap.habit.id)) return
  const next = [...habits]
  next.splice(Math.min(snap.index, next.length), 0, snap.habit)
  habits = next
  if (snap.completions.length)
    completions = { ...completions, [snap.habit.id]: snap.completions }
  emit()
  emitCompletions()
}

export function clearAll() {
  habits = []
  completions = {}
  emit()
  emitCompletions()
}

export function exportData(): string {
  return JSON.stringify({ habits, completions }, null, 2)
}

/** Импорт из JSON. false — если структура невалидна. */
export function importData(json: string): boolean {
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed.habits)) return false
    habits = parsed.habits
    completions =
      parsed.completions && typeof parsed.completions === "object"
        ? parsed.completions
        : {}
    emit()
    emitCompletions()
    return true
  } catch {
    return false
  }
}

// --- Выполнение привычек ---

/** Локальный ключ даты YYYY-MM-DD (без UTC-сдвига). */
export function dateKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`
}

const JS_DAY_TO_WEEKDAY: WeekDay[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]

export function weekDayOf(d: Date): WeekDay {
  return JS_DAY_TO_WEEKDAY[d.getDay()]
}

export function isDone(id: string, key: string): boolean {
  return completions[id]?.includes(key) ?? false
}

/** Переключает выполнение привычки за конкретный день. */
export function toggleCompletion(id: string, key = dateKey()) {
  const done = completions[id] ?? []
  const next = done.includes(key)
    ? done.filter((k) => k !== key)
    : [...done, key]
  completions = { ...completions, [id]: next }
  emitCompletions()
}

/**
 * Текущая серия: подряд идущие запланированные дни с отметкой, считая назад.
 * Сегодня без отметки серию не рвёт (день ещё не закончился).
 * ponytail: наивный проход до 366 дней назад; upgrade — кешировать серию, если станет узким местом.
 */
export function getStreak(habit: Habit): number {
  if (habit.days.length === 0) return 0
  const done = new Set(completions[habit.id] ?? [])
  const d = new Date()
  let streak = 0
  for (let i = 0; i < 366; i++) {
    if (habit.days.includes(weekDayOf(d))) {
      if (done.has(dateKey(d))) streak++
      else if (i !== 0) break
    }
    d.setDate(d.getDate() - 1)
  }
  return streak
}
