// Активное пространство — общее состояние приложения. Живёт в shared, чтобы
// entities/habit и entities/workspace зависели вниз, а не боком друг на друга.
const ACTIVE_KEY = "active-workspace"

let activeId: string = localStorage.getItem(ACTIVE_KEY) ?? "personal"
const listeners = new Set<(id: string) => void>()

export function getActiveWorkspaceId(): string {
  return activeId
}

/** Меняет активное пространство и уведомляет подписчиков (habit-стор, UI). */
export function setActiveWorkspaceId(id: string) {
  if (id === activeId) return
  activeId = id
  localStorage.setItem(ACTIVE_KEY, id)
  listeners.forEach((l) => l(id))
}

/** Подписка на смену активного пространства. */
export function subscribeActiveWorkspace(cb: (id: string) => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
