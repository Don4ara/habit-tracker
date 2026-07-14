import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { Copy, Loader2 } from "lucide-react"
import { toast } from "sonner"

import type { Challenge } from "@/entities/challenge"
import { buildChallengeUrl, encodePayload } from "@/shared/lib"
import { Button } from "@/shared/ui/button"

// Кодирует определение челленджа в короткий payload для QR/ссылки.
const encodeChallenge = (c: Challenge): Promise<string> =>
  encodePayload(JSON.stringify({ t: c.title, i: c.icon, g: c.goal, by: c.by }))

/** QR-код + ссылка «позвать друга» на конкретный челлендж. */
export function ChallengeQR({ challenge }: { challenge: Challenge }) {
  const [qr, setQr] = useState<string | null>(null)
  const [url, setUrl] = useState("")

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setQr(null)
      const link = buildChallengeUrl(await encodeChallenge(challenge))
      const dataUrl = await QRCode.toDataURL(link, {
        errorCorrectionLevel: "M",
        margin: 1,
        width: 280,
        color: { dark: "#000000", light: "#ffffff" },
      })
      if (cancelled) return
      setUrl(link)
      setQr(dataUrl)
    })()
    return () => {
      cancelled = true
    }
  }, [challenge])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Ссылка скопирована")
    } catch {
      toast.error("Не удалось скопировать")
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      {qr ? (
        <>
          <img
            src={qr}
            alt="QR-код приглашения на челлендж"
            className="size-56 rounded-lg border bg-white p-2"
          />
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="size-4" />
            Скопировать ссылку
          </Button>
        </>
      ) : (
        <div className="text-muted-foreground flex h-56 items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Генерация…
        </div>
      )}
    </div>
  )
}
