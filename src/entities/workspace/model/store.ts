import { useSyncExternalStore } from "react"

import {
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  subscribeActiveWorkspace,
} from "@/shared/lib"

import type { Workspace } from "./types"

const WORKSPACES_KEY = "workspaces"

const DEFAULT: Workspace = { id: "personal", name: "Личный", icon: "🏠" }

let workspaces: Workspace[] = load()
const listeners = new Set<() => void>()

// Активный id хранится в shared — валидируем его против списка при старте.
if (!workspaces.some((w) => w.id === getActiveWorkspaceId()))
  setActiveWorkspaceId(workspaces[0].id)

function load(): Workspace[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(WORKSPACES_KEY) ?? "null")
    if (Array.isArray(parsed) && parsed.length) return parsed
  } catch {
    /* ignore */
  }
  return [DEFAULT]
}

function persist() {
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces))
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
  return useSyncExternalStore(subscribeActiveWorkspace, getActiveWorkspaceId)
}

export function setActiveWorkspace(id: string) {
  if (!workspaces.some((w) => w.id === id)) return
  setActiveWorkspaceId(id)
}

const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2)

/** Создаёт пространство и делает его активным. */
export function addWorkspace(name: string, icon?: string): Workspace {
  const ws: Workspace = { id: genId(), name: name.trim(), icon }
  workspaces = [...workspaces, ws]
  persist()
  setActiveWorkspaceId(ws.id)
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
  localStorage.removeItem(`habit-notes:${id}`)
  localStorage.removeItem(`habit-freezes:${id}`)
  persist()
  if (getActiveWorkspaceId() === id) setActiveWorkspaceId(workspaces[0].id)
}
