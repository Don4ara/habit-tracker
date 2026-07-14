import { useSyncExternalStore } from "react"

import { getActiveWorkspaceId, subscribeActiveWorkspace } from "@/shared/lib"

import type { Habit, WeekDay } from "./types"

// Данные хранятся по пространствам: `habits:<wsId>`, `habit-completions:<wsId>`,
// заметки — `habit-notes:<wsId>` = { habitId: { dateKey: текст } }.
const hKey = () => `habits:${getActiveWorkspaceId()}`
const cKey = () => `habit-completions:${getActiveWorkspaceId()}`
const nKey = () => `habit-notes:${getActiveWorkspaceId()}`
// Заморозки: `habit-freezes:<wsId>` = { habitId: [dateKey,...] } — дни, где пропуск не рвёт серию.
const fKey = () => `habit-freezes:${getActiveWorkspaceId()}`
const FREEZE_LIMIT_KEY = "freeze-limit"
// Блокировка заморозок до даты (ISO). Под замком нельзя добавлять заморозки и
// повышать лимит — чтобы не подкручивать себе поблажки во время челленджа.
const FREEZE_LOCK_KEY = "freeze-lock-until"

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

type Notes = Record<string, Record<string, string>>

let habits: Habit[] = load()
let completions: Record<string, string[]> = loadCompletions()
let notes: Notes = loadNotes()
let freezes: Record<string, string[]> = loadFreezes()
let freezeLimit: number = loadFreezeLimit()
let freezeLockUntil: string = localStorage.getItem(FREEZE_LOCK_KEY) ?? ""
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
  notes = loadNotes()
  freezes = loadFreezes()
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

function loadNotes(): Notes {
  try {
    return JSON.parse(localStorage.getItem(nKey()) ?? "{}")
  } catch {
    return {}
  }
}

function loadFreezes(): Record<string, string[]> {
  try {
    return JSON.parse(localStorage.getItem(fKey()) ?? "{}")
  } catch {
    return {}
  }
}

function loadFreezeLimit(): number {
  const n = Number(localStorage.getItem(FREEZE_LIMIT_KEY))
  return Number.isFinite(n) && n >= 0 ? n : 2
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

function emitNotes() {
  localStorage.setItem(nKey(), JSON.stringify(notes))
  notify()
}

function emitFreezes() {
  localStorage.setItem(fKey(), JSON.stringify(freezes))
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

export function useNotes(): Notes {
  return useSyncExternalStore(subscribe, () => notes)
}

export function useFreezes(): Record<string, string[]> {
  return useSyncExternalStore(subscribe, () => freezes)
}

export function useFreezeLimit(): number {
  return useSyncExternalStore(subscribe, () => freezeLimit)
}

export function getFreezeLimit(): number {
  return freezeLimit
}

export function useFreezeLock(): string {
  return useSyncExternalStore(subscribe, () => freezeLockUntil)
}

/** Заблокированы ли заморозки прямо сейчас (дата блокировки ещё не прошла). */
export function isFreezeLocked(): boolean {
  return !!freezeLockUntil && new Date(freezeLockUntil).getTime() > Date.now()
}

/**
 * Блокирует заморозки до указанной даты (ISO). Можно только продлить блокировку,
 * не сократить — иначе смысл теряется. Возвращает false, если дата невалидна или
 * не позже текущего замка/сейчас.
 */
export function lockFreezesUntil(dateIso: string): boolean {
  const target = new Date(dateIso).getTime()
  if (!Number.isFinite(target)) return false
  const floor = Math.max(
    Date.now(),
    freezeLockUntil ? new Date(freezeLockUntil).getTime() : 0
  )
  if (target <= floor) return false
  freezeLockUntil = dateIso
  localStorage.setItem(FREEZE_LOCK_KEY, dateIso)
  notify()
  return true
}

/** Меняет лимит заморозок на месяц (глобально для всех пространств). */
export function setFreezeLimit(n: number) {
  const next = Math.max(0, Math.floor(n))
  // Под блокировкой лимит нельзя менять вообще — ни вверх, ни вниз.
  if (isFreezeLocked()) return
  freezeLimit = next
  localStorage.setItem(FREEZE_LIMIT_KEY, String(freezeLimit))
  notify()
}

export function isFrozen(id: string, key: string): boolean {
  return freezes[id]?.includes(key) ?? false
}

/** Сколько заморозок израсходовано ВСЕМИ привычками в месяце (YYYY-MM). Лимит общий. */
export function freezesUsedInMonth(month: string): number {
  return Object.values(freezes)
    .flat()
    .filter((k) => k.startsWith(month)).length
}

/**
 * Заморозить/разморозить день привычки. Лимит заморозок общий на все привычки.
 * Возвращает false, если лимит месяца исчерпан (заморозка не добавлена).
 */
export function toggleFreeze(id: string, key = dateKey()): boolean {
  const list = freezes[id] ?? []
  if (list.includes(key)) {
    const next = list.filter((k) => k !== key)
    const rest = { ...freezes }
    if (next.length) rest[id] = next
    else delete rest[id]
    freezes = rest
    emitFreezes()
    return true
  }
  if (isFreezeLocked()) return false // под блокировкой новые заморозки нельзя
  if (freezesUsedInMonth(key.slice(0, 7)) >= freezeLimit) return false
  freezes = { ...freezes, [id]: [...list, key] }
  emitFreezes()
  return true
}

export function getNote(id: string, key: string): string {
  return notes[id]?.[key] ?? ""
}

/** Сохраняет/удаляет заметку привычки за день. Пустой текст — удаление. */
export function setNote(id: string, key: string, text: string) {
  const trimmed = text.trim()
  const forHabit = { ...(notes[id] ?? {}) }
  if (trimmed) forHabit[key] = trimmed
  else delete forHabit[key]
  if (Object.keys(forHabit).length) notes = { ...notes, [id]: forHabit }
  else {
    const rest = { ...notes }
    delete rest[id]
    notes = rest
  }
  emitNotes()
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

/** Создаёт привычку. Возвращает её, либо null если название уже занято. */
export function addHabit(data: Omit<Habit, "id" | "createdAt">): Habit | null {
  const name = data.name.trim().toLowerCase()
  if (habits.some((h) => h.name.trim().toLowerCase() === name)) return null
  const habit: Habit = { ...data, id: genId(), createdAt: new Date().toISOString() }
  habits = [...habits, habit]
  emit()
  return habit
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
  if (notes[id]) {
    const n = { ...notes }
    delete n[id]
    notes = n
    emitNotes()
  }
  if (freezes[id]) {
    const f = { ...freezes }
    delete f[id]
    freezes = f
    emitFreezes()
  }
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
  notes = {}
  freezes = {}
  emit()
  emitCompletions()
  emitNotes()
  emitFreezes()
}

export function exportData(): string {
  return JSON.stringify({ habits, completions, notes, freezes }, null, 2)
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
    notes =
      parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {}
    freezes =
      parsed.freezes && typeof parsed.freezes === "object" ? parsed.freezes : {}
    emit()
    emitCompletions()
    emitNotes()
    emitFreezes()
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
 * «Заморозка»: вручную помеченный день (снежинкой) — пропуск не рвёт серию.
 * ponytail: наивный проход до 366 дней назад; upgrade — кешировать серию, если станет узким местом.
 */
export function getStreak(habit: Habit): number {
  if (habit.days.length === 0) return 0
  const done = new Set(completions[habit.id] ?? [])
  const frozen = new Set(freezes[habit.id] ?? [])
  const createdKey = dateKey(new Date(habit.createdAt))
  const d = new Date()
  let streak = 0
  for (let i = 0; i < 366; i++) {
    const key = dateKey(d)
    if (key < createdKey) break // до создания привычки серии нет
    if (habit.days.includes(weekDayOf(d))) {
      if (done.has(key)) streak++
      else if (i !== 0 && !frozen.has(key)) break // не заморожен → серия рвётся
    }
    d.setDate(d.getDate() - 1)
  }
  return streak
}

/** Сколько заморозок осталось в текущем месяце (общий лимит на все привычки). */
export function freezesLeftThisMonth(): number {
  return Math.max(0, freezeLimit - freezesUsedInMonth(dateKey().slice(0, 7)))
}
