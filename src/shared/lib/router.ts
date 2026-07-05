import { useSyncExternalStore } from "react"

export type Route = "home" | "habits" | "stats" | "achievements" | "settings"

export const ROUTES: Route[] = [
  "home",
  "habits",
  "stats",
  "achievements",
  "settings",
]

function current(): Route {
  const h = location.hash.replace(/^#\/?/, "")
  return (ROUTES as string[]).includes(h) ? (h as Route) : "home"
}

function subscribe(cb: () => void) {
  window.addEventListener("hashchange", cb)
  return () => window.removeEventListener("hashchange", cb)
}

export function useRoute(): Route {
  return useSyncExternalStore(subscribe, current, () => "home")
}

export function navigate(route: Route) {
  location.hash = `/${route}`
}
