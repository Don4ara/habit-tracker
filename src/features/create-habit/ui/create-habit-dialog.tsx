import { useState, type ReactNode } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { EmojiPicker } from "frimousse"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import { Field, FieldError, FieldLabel } from "@/shared/ui/field"
import {
  addHabit,
  updateHabit,
  type Habit,
  type WeekDay,
  type WeekDayOption,
} from "@/entities/habit"

const categories = ["Здоровье", "Спорт", "Учёба", "Чтение"]

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

function EmojiButton({
  value,
  onSelect,
}: {
  value: string
  onSelect: (emoji: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="icon" aria-label="Выбрать эмодзи">
          {value || "+"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-0">
        <EmojiPicker.Root
          locale="ru"
          onEmojiSelect={({ emoji }) => {
            onSelect(emoji)
            setOpen(false)
          }}
          className="flex h-80 w-72 flex-col"
        >
          <EmojiPicker.Search
            placeholder="Поиск эмодзи…"
            className="m-2 rounded-md border bg-transparent px-2 py-1.5 text-sm outline-none"
          />
          <EmojiPicker.Viewport className="flex-1 overflow-y-auto px-2 pb-2">
            <EmojiPicker.Loading className="p-4 text-sm text-muted-foreground">
              Загрузка…
            </EmojiPicker.Loading>
            <EmojiPicker.Empty className="p-4 text-sm text-muted-foreground">
              Ничего не найдено
            </EmojiPicker.Empty>
            <EmojiPicker.List
              components={{
                CategoryHeader: ({ category, ...props }) => (
                  <div
                    className="bg-popover py-1.5 text-xs font-medium text-muted-foreground"
                    {...props}
                  >
                    {category.label}
                  </div>
                ),
                Emoji: ({ emoji, ...props }) => (
                  <button
                    className="flex size-8 items-center justify-center rounded-md text-lg data-[active]:bg-accent"
                    {...props}
                  >
                    {emoji.emoji}
                  </button>
                ),
              }}
            />
          </EmojiPicker.Viewport>
        </EmojiPicker.Root>
      </PopoverContent>
    </Popover>
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
  const [icon, setIcon] = useState(habit?.icon ?? "")
  const [category, setCategory] = useState(habit?.category ?? categories[0])
  const [days, setDays] = useState<Set<WeekDay>>(
    new Set(habit?.days ?? weekDays.map((d) => d.id))
  )

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
      setCategory(habit?.category ?? categories[0])
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
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Pill key={c} active={category === c} onClick={() => setCategory(c)}>
                  {c}
                </Pill>
              ))}
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
