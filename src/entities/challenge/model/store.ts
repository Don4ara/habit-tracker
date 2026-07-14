import { useSyncExternalStore } from "react"

import type { Challenge } from "./types"

const KEY = "challenges"

let challenges: Challenge[] = load()
const listeners = new Set<() => void>()

function load(): Challenge[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]")
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persist() {
  localStorage.setItem(KEY, JSON.stringify(challenges))
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useChallenges(): Challenge[] {
  return useSyncExternalStore(subscribe, () => challenges)
}

// ponytail: randomUUID недоступен вне secure context — фолбэк на timestamp+random
const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2)

export function addChallenge(data: {
  habitId: string
  title: string
  icon?: string
  goal: number
  by?: string
}): Challenge {
  const c: Challenge = {
    id: genId(),
    habitId: data.habitId,
    title: data.title.trim(),
    icon: data.icon || undefined,
    goal: Math.max(1, Math.floor(data.goal)),
    by: data.by?.trim() || undefined,
    createdAt: new Date().toISOString(),
  }
  challenges = [...challenges, c]
  persist()
  return c
}

export function removeChallenge(id: string) {
  challenges = challenges.filter((c) => c.id !== id)
  persist()
}
