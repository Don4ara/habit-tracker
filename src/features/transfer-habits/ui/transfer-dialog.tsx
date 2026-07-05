import { useEffect, useState, type ReactNode } from "react"
import QRCode from "qrcode"
import { Copy, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { exportData } from "@/entities/habit"
import { buildTransferUrl, encodePayload } from "@/shared/lib"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"

export function TransferDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [qr, setQr] = useState<string | null>(null)
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      setQr(null)
      setError(null)
      try {
        const payload = await encodePayload(exportData())
        const link = buildTransferUrl(payload)
        const dataUrl = await QRCode.toDataURL(link, {
          errorCorrectionLevel: "L",
          margin: 1,
          width: 280,
          color: { dark: "#000000", light: "#ffffff" },
        })
        if (cancelled) return
        setUrl(link)
        setQr(dataUrl)
      } catch {
        if (!cancelled)
          setError(
            "Слишком много данных для одного QR-кода. Используйте экспорт в файл."
          )
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Ссылка скопирована")
    } catch {
      toast.error("Не удалось скопировать")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Перенос на другое устройство</DialogTitle>
          <DialogDescription>
            Отсканируйте код камерой телефона — привычки и история загрузятся на
            новом устройстве. Текущие данные там будут заменены.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {error ? (
            <p className="text-destructive text-center text-sm">{error}</p>
          ) : qr ? (
            <>
              <img
                src={qr}
                alt="QR-код для переноса привычек"
                className="size-64 rounded-lg border bg-white p-2"
              />
              <Button variant="outline" size="sm" onClick={copyLink}>
                <Copy className="size-4" />
                Скопировать ссылку
              </Button>
            </>
          ) : (
            <div className="text-muted-foreground flex h-64 items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              Генерация…
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
