import { useSyncExternalStore } from "react"

import type { Habit } from "./types"

const STORAGE_KEY = "habits"

let habits: Habit[] = load()
const listeners = new Set<() => void>()

function load(): Habit[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
  } catch {
    return []
  }
}

function emit() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits))
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useHabits(): Habit[] {
  return useSyncExternalStore(subscribe, () => habits)
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

export function removeHabit(id: string) {
  habits = habits.filter((h) => h.id !== id)
  emit()
}
