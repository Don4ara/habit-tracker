export interface Habit {
  id: string
  title: string
  /** ISO dates the habit was completed */
  completedDates: string[]
  createdAt: string
}
