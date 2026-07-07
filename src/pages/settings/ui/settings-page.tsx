import { useRef, useState } from "react"
import { Download, Minus, MoonIcon, Plus, QrCode, Snowflake, SunIcon, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import {
  exportData,
  importData,
  clearAll,
  useFreezeLimit,
  setFreezeLimit,
} from "@/entities/habit"
import { TransferDialog } from "@/features/transfer-habits"
import { PageBody, PageHeader } from "@/widgets/page-header"
import { Button } from "@/shared/ui/button"
import { ConfirmDialog } from "@/shared/ui/confirm-dialog"
import { useTheme } from "@/shared/lib"

function Row({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-muted-foreground text-xs">{description}</div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  )
}

export function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"
  const freezeLimit = useFreezeLimit()
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const handleExport = () => {
    const blob = new Blob([exportData()], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `habits-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Данные экспортированы")
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = "" // сброс — чтобы можно было выбрать тот же файл снова
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (importData(String(reader.result))) toast.success("Данные импортированы")
      else toast.error("Не удалось прочитать файл")
    }
    reader.readAsText(file)
  }

  const handleClear = () => {
    clearAll()
    toast.success("Все данные удалены")
  }

  return (
    <>
      <PageHeader title="Настройки" />
      <PageBody>
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Внешний вид
          </h2>
          <Row
            title="Тема"
            description={isDark ? "Тёмная" : "Светлая"}
            action={
              <Button
                size="sm"
                onClick={toggleTheme}
                className="min-w-8 bg-primary text-primary-foreground ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
              >
                {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
                {isDark ? "Светлая" : "Тёмная"}
              </Button>
            }
          />
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Серии
          </h2>
          <Row
            title="Заморозки в месяц"
            description="Сколько пропущенных дней в месяц можно заморозить, не разрывая серию"
            action={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Меньше"
                  onClick={() => setFreezeLimit(freezeLimit - 1)}
                  disabled={freezeLimit <= 0}
                >
                  <Minus className="size-4" />
                </Button>
                <span className="flex w-8 items-center justify-center gap-1 font-semibold tabular-nums">
                  <Snowflake className="size-3.5 text-blue-500" />
                  {freezeLimit}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Больше"
                  onClick={() => setFreezeLimit(freezeLimit + 1)}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            }
          />
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Данные
          </h2>
          <Row
            title="Перенос по QR"
            description="Показать QR-код — отсканируйте его на телефоне, чтобы перенести привычки"
            action={
              <TransferDialog
                trigger={
                  <Button variant="outline" size="sm">
                    <QrCode className="size-4" />
                    Показать QR
                  </Button>
                }
              />
            }
          />
          <Row
            title="Экспорт"
            description="Сохранить привычки и отметки в файл JSON"
            action={
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="size-4" />
                Экспорт
              </Button>
            }
          />
          <Row
            title="Импорт"
            description="Загрузить данные из файла JSON (заменит текущие)"
            action={
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="size-4" />
                Импорт
              </Button>
            }
          />
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImport}
          />
          <Row
            title="Сбросить всё"
            description="Удалить все привычки и историю отметок"
            action={
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmClear(true)}
              >
                <Trash2 className="size-4" />
                Удалить
              </Button>
            }
          />
        </div>

        <ConfirmDialog
          open={confirmClear}
          onOpenChange={setConfirmClear}
          title="Сбросить все данные?"
          description="Все привычки и история отметок текущего пространства будут удалены. Действие необратимо."
          onConfirm={handleClear}
        />
      </PageBody>
    </>
  )
}
