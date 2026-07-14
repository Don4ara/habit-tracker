export interface Challenge {
  id: string
  habitId: string // связанная привычка на дашборде — её отметки и есть прогресс
  title: string
  icon?: string
  goal: number // сколько дней нужно отметить
  by?: string // имя друга, который позвал на челлендж
  createdAt: string
}
