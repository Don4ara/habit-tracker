export type WeekDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"

export interface WeekDayOption {
  id: WeekDay
  label: string
}

export interface Habit {
  id: string
  name: string
  icon?: string
  category: string
  days: WeekDay[]
  createdAt: string
}
