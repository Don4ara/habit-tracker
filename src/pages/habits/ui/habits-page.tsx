import { Plus } from "lucide-react"

import { CreateHabitDialog } from "@/features/create-habit"
import { HabitsList } from "@/widgets/habits-board"
import { PageBody, PageHeader } from "@/widgets/page-header"
import { Button } from "@/shared/ui/button"

export function HabitsPage() {
  return (
    <>
      <PageHeader
        title="Привычки"
        action={
          <CreateHabitDialog
            trigger={
              <Button size="sm">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Новая привычка</span>
              </Button>
            }
          />
        }
      />
      <PageBody>
        <HabitsList />
      </PageBody>
    </>
  )
}
