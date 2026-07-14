import { useRef, useState } from "react"
import { EmojiPicker } from "frimousse"

import { Button } from "@/shared/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"

export function EmojiButton({
  value,
  onSelect,
}: {
  value: string
  onSelect: (emoji: string) => void
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  // Портуем внутрь диалога (если есть): иначе react-remove-scroll диалога
  // блокирует прокрутку списка эмодзи в портале на body.
  const [container, setContainer] = useState<HTMLElement | null>(null)

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next)
          setContainer(
            triggerRef.current?.closest<HTMLElement>(
              '[data-slot="dialog-content"]'
            ) ?? null
          )
        setOpen(next)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          size="icon"
          aria-label="Выбрать эмодзи"
        >
          {value || "+"}
        </Button>
      </PopoverTrigger>
      <PopoverContent container={container} className="w-fit p-0">
        <EmojiPicker.Root
          locale="ru"
          // Данные эмодзи раздаём локально (public/emojibase) — иначе frimousse
          // тянет их с внешнего CDN, что виснет на «Загрузка…» офлайн/в PWA.
          emojibaseUrl={`${import.meta.env.BASE_URL}emojibase`}
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
