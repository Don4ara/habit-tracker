import { useSyncExternalStore } from "react"

import type { Workspace } from "./types"

const WORKSPACES_KEY = "workspaces"
const ACTIVE_KEY = "active-workspace"

const DEFAULT: Workspace = { id: "personal", name: "Личный", icon: "🏠" }

let workspaces: Workspace[] = load()
let activeId: string = loadActive()
const listeners = new Set<() => void>()
const activeListeners = new Set<(id: string) => void>()

function load(): Workspace[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(WORKSPACES_KEY) ?? "null")
    if (Array.isArray(parsed) && parsed.length) return parsed
  } catch {
    /* ignore */
  }
  return [DEFAULT]
}

function loadActive(): string {
  const saved = localStorage.getItem(ACTIVE_KEY)
  return workspaces.some((w) => w.id === saved) ? saved! : workspaces[0].id
}

function persist() {
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces))
  localStorage.setItem(ACTIVE_KEY, activeId)
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useWorkspaces(): Workspace[] {
  return useSyncExternalStore(subscribe, () => workspaces)
}

export function useActiveWorkspaceId(): string {
  return useSyncExternalStore(subscribe, () => activeId)
}

export function getActiveWorkspaceId(): string {
  return activeId
}

/** Подписка для habit-стора: перезагрузка данных при смене активного пространства. */
export function subscribeActiveWorkspace(cb: (id: string) => void) {
  activeListeners.add(cb)
  return () => activeListeners.delete(cb)
}

export function setActiveWorkspace(id: string) {
  if (id === activeId || !workspaces.some((w) => w.id === id)) return
  activeId = id
  activeListeners.forEach((l) => l(activeId))
  persist()
}

const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2)

/** Создаёт пространство и делает его активным. */
export function addWorkspace(name: string, icon?: string): Workspace {
  const ws: Workspace = { id: genId(), name: name.trim(), icon }
  workspaces = [...workspaces, ws]
  setActiveWorkspace(ws.id) // persist внутри
  return ws
}

export function renameWorkspace(id: string, name: string, icon?: string) {
  workspaces = workspaces.map((w) =>
    w.id === id ? { ...w, name: name.trim(), icon } : w
  )
  persist()
}

/**
 * Удаляет пространство и его данные. Нельзя удалить последнее.
 * ponytail: чистит ключи habit-стора напрямую по соглашению об именах.
 */
export function removeWorkspace(id: string) {
  if (workspaces.length <= 1) return
  workspaces = workspaces.filter((w) => w.id !== id)
  localStorage.removeItem(`habits:${id}`)
  localStorage.removeItem(`habit-completions:${id}`)
  if (activeId === id) {
    activeId = workspaces[0].id
    activeListeners.forEach((l) => l(activeId))
  }
  persist()
}
