import { useState, type ReactNode } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Check, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { EmojiButton } from "@/shared/ui/emoji-button"
import { Field, FieldError, FieldLabel } from "@/shared/ui/field"
import {
  addHabit,
  updateHabit,
  useAllHabits,
  type Habit,
  type WeekDay,
  type WeekDayOption,
} from "@/entities/habit"

const defaultCategories = ["Здоровье", "Спорт", "Учёба", "Чтение"]

const weekDays: WeekDayOption[] = [
  { id: "mon", label: "Пн" },
  { id: "tue", label: "Вт" },
  { id: "wed", label: "Ср" },
  { id: "thu", label: "Чт" },
  { id: "fri", label: "Пт" },
  { id: "sat", label: "Сб" },
  { id: "sun", label: "Вс" },
]

const habitSchema = z.object({
  name: z.string().trim().min(1, "Введите название"),
})

type HabitForm = z.infer<typeof habitSchema>

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "secondary"}
      aria-pressed={active}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

export function CreateHabitDialog({
  trigger,
  habit,
  open: openProp,
  onOpenChange: setOpenProp,
}: {
  trigger?: ReactNode
  habit?: Habit
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isEdit = !!habit
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState
  const setOpen = (v: boolean) =>
    setOpenProp ? setOpenProp(v) : setOpenState(v)
  const allHabits = useAllHabits()
  const [icon, setIcon] = useState(habit?.icon ?? "")
  const [category, setCategory] = useState(habit?.category ?? defaultCategories[0])
  const [addedCats, setAddedCats] = useState<string[]>([])
  const [newCat, setNewCat] = useState("")
  const [adding, setAdding] = useState(false)
  const [days, setDays] = useState<Set<WeekDay>>(
    new Set(habit?.days ?? weekDays.map((d) => d.id))
  )

  // Дефолтные ∪ существующие ∪ добавленные ∪ выбранная — без дублей.
  const categories = [
    ...new Set([
      ...defaultCategories,
      ...allHabits.map((h) => h.category),
      ...addedCats,
      category,
    ]),
  ]

  const addCategory = () => {
    const trimmed = newCat.trim()
    if (!trimmed) return
    if (!categories.includes(trimmed)) setAddedCats((prev) => [...prev, trimmed])
    setCategory(trimmed)
    setNewCat("")
    setAdding(false)
  }

  const removeCategory = (c: string) => {
    setAddedCats((prev) => prev.filter((x) => x !== c))
    if (category === c) setCategory(defaultCategories[0])
  }

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<HabitForm>({
    resolver: zodResolver(habitSchema),
    defaultValues: { name: habit?.name ?? "" },
  })

  // Сброс формы к значениям привычки при каждом открытии.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      reset({ name: habit?.name ?? "" })
      setIcon(habit?.icon ?? "")
      setCategory(habit?.category ?? defaultCategories[0])
      setAddedCats([])
      setNewCat("")
      setAdding(false)
      setDays(new Set(habit?.days ?? weekDays.map((d) => d.id)))
    }
    setOpen(next)
  }

  const toggleDay = (id: WeekDay) =>
    setDays((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const onSubmit = ({ name }: HabitForm) => {
    const payload = { name, icon: icon || undefined, category, days: [...days] }
    const ok = isEdit
      ? updateHabit(habit!.id, payload)
      : addHabit(payload)
    if (!ok) {
      setError("name", { message: `Привычка «${name}» уже существует` })
      return
    }
    toast.success(
      isEdit ? `Привычка «${name}» обновлена` : `Привычка «${name}» создана`
    )
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Изменить привычку" : "Новая привычка"}</DialogTitle>
        </DialogHeader>

        <form id="create-habit-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <Field data-invalid={!!errors.name || undefined}>
            <FieldLabel htmlFor="habit-name">Название</FieldLabel>
            <div className="flex gap-2">
              <EmojiButton value={icon} onSelect={setIcon} />
              <Input
                id="habit-name"
                placeholder="Например, Пить воду"
                aria-invalid={!!errors.name || undefined}
                {...register("name")}
              />
            </div>
            <FieldError errors={[errors.name]} />
          </Field>

          <div className="grid gap-2">
            <Label>Категория</Label>
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((c) => {
                const active = category === c
                const removable = addedCats.includes(c)
                return (
                  <Button
                    key={c}
                    type="button"
                    size="sm"
                    variant={active ? "default" : "secondary"}
                    aria-pressed={active}
                    onClick={() => setCategory(c)}
                    className={removable ? "pr-1" : undefined}
                  >
                    {c}
                    {removable && (
                      <span
                        role="button"
                        aria-label={`Удалить категорию ${c}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          removeCategory(c)
                        }}
                        className="ml-1 inline-flex rounded-sm p-0.5 hover:bg-black/10 dark:hover:bg-white/20"
                      >
                        <X className="size-3" />
                      </span>
                    )}
                  </Button>
                )
              })}

              {adding ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addCategory()
                      } else if (e.key === "Escape") {
                        e.preventDefault()
                        setNewCat("")
                        setAdding(false)
                      }
                    }}
                    placeholder="Название"
                    autoFocus
                    className="h-8 w-40"
                  />
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="secondary"
                    aria-label="Добавить категорию"
                    onClick={addCategory}
                    disabled={!newCat.trim()}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Отмена"
                    onClick={() => {
                      setNewCat("")
                      setAdding(false)
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  aria-label="Добавить категорию"
                  onClick={() => setAdding(true)}
                >
                  <Plus className="size-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Повторять по дням</Label>
            <div className="flex flex-wrap gap-2">
              {weekDays.map((d) => (
                <Pill key={d.id} active={days.has(d.id)} onClick={() => toggleDay(d.id)}>
                  {d.label}
                </Pill>
              ))}
            </div>
          </div>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Отмена</Button>
          </DialogClose>
          <Button type="submit" form="create-habit-form" disabled={days.size === 0}>
            {isEdit ? "Сохранить" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
