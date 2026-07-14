import { removeChallenge, type Challenge } from "@/entities/challenge"
import { removeHabit } from "@/entities/habit"

/**
 * Удаляет челлендж вместе со связанной привычкой.
 * ponytail: привычку удалит только если она в активном пространстве (removeHabit
 * работает по текущему ws). Челлендж в чужом ws оставит осиротевшую привычку —
 * upgrade, если челленджи станут привязаны к пространству.
 */
export function leaveChallenge(challenge: Challenge) {
  removeHabit(challenge.habitId)
  removeChallenge(challenge.id)
}
