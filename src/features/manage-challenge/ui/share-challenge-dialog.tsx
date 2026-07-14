import { useState, type ReactNode } from "react"

import type { Challenge } from "@/entities/challenge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"
import { ChallengeQR } from "./challenge-qr"

/** Повторно позвать друга на уже созданный челлендж. */
export function ShareChallengeDialog({
  challenge,
  trigger,
}: {
  challenge: Challenge
  trigger: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Позвать друга</DialogTitle>
          <DialogDescription>
            Отсканируйте код, чтобы присоединиться к челленджу «{challenge.title}
            ».
          </DialogDescription>
        </DialogHeader>
        {open && <ChallengeQR challenge={challenge} />}
      </DialogContent>
    </Dialog>
  )
}
