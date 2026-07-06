/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core"
import { createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching"
import { NavigationRoute, registerRoute } from "workbox-routing"

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: { url: string; revision: string | null }[]
}

// Сразу активируем новый SW и берём контроль над страницами.
self.skipWaiting()
clientsClaim()

// Прекэш всех ассетов сборки (html, js, css, шрифты, иконки).
precacheAndRoute(self.__WB_MANIFEST)

// Офлайн-фолбэк для SPA: любые навигации отдаём из закэшированного index.html.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api\//],
  })
)
