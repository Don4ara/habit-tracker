import { useState } from "react"
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { addHabit, type WeekDay } from "@/entities/habit"
import { completeOnboarding, useOnboarded } from "@/entities/profile"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { cn } from "@/shared/lib"

const EVERY_DAY: WeekDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

// Стартовые привычки — каждая уже с категорией, чтобы показать деление по категориям.
const STARTERS = [
  { name: "Пить воду", icon: "💧", category: "Здоровье" },
  { name: "Зарядка", icon: "🤸", category: "Спорт" },
  { name: "Читать 20 минут", icon: "📖", category: "Чтение" },
  { name: "Учить язык", icon: "🗣️", category: "Учёба" },
  { name: "Медитация", icon: "🧘", category: "Здоровье" },
  { name: "Прогулка", icon: "🚶", category: "Здоровье" },
]

const STEPS = 3

export function OnboardingGate() {
  const onboarded = useOnboarded()
  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [closing, setClosing] = useState(false)

  if (onboarded) return null

  const toggle = (habitName: string) =>
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(habitName)) next.delete(habitName)
      else next.add(habitName)
      return next
    })

  // Проигрываем fade-out, затем завершаем — оверлей уходит тихонько.
  const leave = (done: () => void) => {
    setClosing(true)
    setTimeout(done, 300)
  }

  const finish = () =>
    leave(() => {
      const created = STARTERS.filter((s) => picked.has(s.name))
        .map((s) => addHabit({ ...s, days: EVERY_DAY }))
        .filter(Boolean).length
      completeOnboarding(name)
      if (created) toast.success(`Добавлено привычек: ${created}`)
    })

  const skip = () => leave(() => completeOnboarding(name))

  const next = () => (step < STEPS - 1 ? setStep((s) => s + 1) : finish())
  const back = () => setStep((s) => Math.max(0, s - 1))

  const nav = (
    <>
      <button
        type="button"
        onClick={skip}
        className="text-muted-foreground text-sm hover:text-foreground"
      >
        Пропустить
      </button>
      {step > 0 && (
        <Button variant="outline" size="lg" onClick={back}>
          <ArrowLeft className="size-4" />
          Назад
        </Button>
      )}
      <Button size="lg" onClick={next} className="max-md:flex-1">
        {step === STEPS - 1 ? (
          "Начать"
        ) : (
          <>
            Продолжить
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </>
  )

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-background duration-300",
        closing ? "animate-out fade-out" : "animate-in fade-in"
      )}
    >
      {/* Верх: прогресс + навигация (справа на ПК) */}
      <div className="mx-auto flex w-full max-w-md items-center gap-4 p-6">
        <div className="flex flex-1 gap-1.5">
          {Array.from({ length: STEPS }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <div className="hidden items-center gap-3 md:flex">{nav}</div>
      </div>

      {/* Центр: контент шага */}
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-6">
        {step === 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col items-center text-center duration-300">
            <div className="mb-6 flex size-20 items-center justify-center rounded-3xl bg-primary/10">
              <Sparkles className="size-10 text-primary" />
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Трекер привычек
            </h1>
            <p className="text-muted-foreground mt-3 text-balance">
              Небольшие ежедневные шаги, которые складываются в большие
              изменения. Настроим за минуту.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col duration-300">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Как вас зовут?
            </h1>
            <p className="text-muted-foreground mt-2">
              Будем обращаться по имени на главной.
            </p>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && next()}
              placeholder="Например, Алекс"
              autoFocus
              className="mt-6 h-12 text-lg"
            />
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col duration-300">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              С чего начнём?
            </h1>
            <p className="text-muted-foreground mt-2">
              Выберите основные привычки — остальное добавите позже.
            </p>
            <div className="mt-6 grid gap-2">
              {STARTERS.map((s) => {
                const active = picked.has(s.name)
                return (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => toggle(s.name)}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                      active ? "border-primary bg-primary/5" : "hover:bg-accent"
                    )}
                  >
                    <span className="text-2xl">{s.icon}</span>
                    <span className="flex-1">
                      <span className="block font-medium">{s.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {s.category}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full border transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input"
                      )}
                    >
                      {active && <Check className="size-4" />}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Низ: навигация на телефоне */}
      <div className="mx-auto flex w-full max-w-md items-center gap-3 p-6 md:hidden">
        {nav}
      </div>
    </div>
  )
}
