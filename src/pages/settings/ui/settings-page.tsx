import { useRef, useState } from "react"
import { Download, Lock, Minus, MoonIcon, Plus, QrCode, Snowflake, SunIcon, Swords, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import {
  exportData,
  importData,
  clearAll,
  useFreezeLimit,
  setFreezeLimit,
  useFreezeLock,
  isFreezeLocked,
  lockFreezesUntil,
} from "@/entities/habit"
import { TransferDialog } from "@/features/transfer-habits"
import { CreateChallengeDialog } from "@/features/manage-challenge"
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
  const lockUntil = useFreezeLock()
  const locked = isFreezeLocked()
  const [lockDate, setLockDate] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("ru-RU")

  const applyLock = () => {
    if (!lockDate) return
    const iso = new Date(`${lockDate}T23:59:59`).toISOString()
    if (lockFreezesUntil(iso)) {
      toast.success(`Заморозки заблокированы до ${fmtDate(iso)}`)
      setLockDate("")
    } else {
      toast.error("Дата должна быть позже текущей блокировки")
    }
  }

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
                  disabled={freezeLimit <= 0 || locked}
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
                  disabled={locked}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            }
          />
          <Row
            title="Блокировка заморозок"
            description="Пока действует, нельзя ставить заморозки и повышать лимит — чтобы честно пройти челлендж. Снять раньше срока нельзя, только продлить."
            action={
              locked ? (
                <span className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
                  <Lock className="size-4" />
                  До {fmtDate(lockUntil)}
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    min={today}
                    value={lockDate}
                    onChange={(e) => setLockDate(e.target.value)}
                    className="border-input bg-transparent h-8 rounded-md border px-2 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={applyLock}
                    disabled={!lockDate}
                  >
                    <Lock className="size-4" />
                    Заблокировать
                  </Button>
                </div>
              )
            }
          />
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Челленджи
          </h2>
          <Row
            title="Челлендж с другом"
            description="Совместная цель на несколько дней — отправьте другу QR, соревнуйтесь. Появится в достижениях."
            action={
              <CreateChallengeDialog
                trigger={
                  <Button variant="outline" size="sm">
                    <Swords className="size-4" />
                    Создать
                  </Button>
                }
              />
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
