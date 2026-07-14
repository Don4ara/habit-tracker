import { useSyncExternalStore } from "react"

// Имя пользователя и флаг пройденного онбординга — глобально, вне пространств.
const NAME_KEY = "user-name"
const ONBOARDED_KEY = "onboarded"

let name = localStorage.getItem(NAME_KEY) ?? ""
// Старый пользователь с уже созданными привычками онбординг не проходит.
let onboarded =
  localStorage.getItem(ONBOARDED_KEY) === "1" ||
  localStorage.getItem("habits:personal") !== null

const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useUserName(): string {
  return useSyncExternalStore(subscribe, () => name)
}

export function useOnboarded(): boolean {
  return useSyncExternalStore(subscribe, () => onboarded)
}

export function setUserName(next: string) {
  name = next.trim()
  localStorage.setItem(NAME_KEY, name)
  notify()
}

/** Завершает первый старт: сохраняет имя и больше не показывает онбординг. */
export function completeOnboarding(next: string) {
  name = next.trim()
  onboarded = true
  localStorage.setItem(NAME_KEY, name)
  localStorage.setItem(ONBOARDED_KEY, "1")
  notify()
}
