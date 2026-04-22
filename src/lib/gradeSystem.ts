// Grade System — shared utility untuk semua dashboard
// Metrics: Bobot Testing, Done Rate, Jumlah Pilot, Total Dok, Ticket Close Rate

export interface GradeInput {
  name: string
  // Coda metrics
  totalDok: number
  doneDok: number       // PILOT + RELEASE + DONE
  pilotCount: number    // ada tanggal pilot
  bobotTesting: number  // bobot_testing_pic total
  bobotDone: number     // test done total
  // Logix metrics
  totalTicket: number
  closedTicket: number
}

export interface GradeResult extends GradeInput {
  // Calculated scores (0-100 each)
  scoreDoneRate:     number  // done/total dok * 100
  scorePilot:        number  // normalized pilot count
  scoreBobot:        number  // bobotDone/bobotTesting * 100
  scoreTicketClose:  number  // closedTicket/totalTicket * 100
  scoreTotalDok:     number  // normalized total dok
  // Final
  totalScore: number         // weighted average 0-100
  grade: "A" | "B" | "C" | "D"
  gradeColor: string
  gradeBg: string
  gradeText: string
  gradeEmoji: string
  rank: number
}

// Weight untuk setiap metric (total = 100%)
const WEIGHTS = {
  doneRate:    0.30,  // 30% — paling penting
  bobot:       0.25,  // 25% — testing quality
  pilot:       0.20,  // 20% — delivery
  ticketClose: 0.15,  // 15% — service responsiveness
  totalDok:    0.10,  // 10% — volume kontribusi
}

export const GRADE_CONFIG = {
  A: { min: 75, color: "#10b981", bg: "from-emerald-500 to-teal-500",   text: "Excellent!",       emoji: "🏆", msg: "Performa luar biasa!" },
  B: { min: 55, color: "#3b82f6", bg: "from-blue-500 to-indigo-500",    text: "Good",             emoji: "🥈", msg: "Raih lebih banyak poin!" },
  C: { min: 35, color: "#f59e0b", bg: "from-amber-500 to-orange-500",   text: "Needs Improvement",emoji: "📈", msg: "Masih bisa lebih baik!" },
  D: { min: 0,  color: "#ef4444", bg: "from-red-500 to-rose-500",       text: "Critical",         emoji: "💪", msg: "Ayo tingkatkan kinerja!" },
}

function normalizeToScore(value: number, max: number, min: number = 0): number {
  if (max <= min) return 0
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
}

export function calculateGrades(members: GradeInput[]): GradeResult[] {
  if (members.length === 0) return []

  // Find max values for normalization
  const maxDok    = Math.max(...members.map(m => m.totalDok), 1)
  const maxPilot  = Math.max(...members.map(m => m.pilotCount), 1)

  const withScores = members.map(m => {
    const scoreDoneRate    = m.totalDok > 0 ? (m.doneDok / m.totalDok) * 100 : 0
    const scoreBobot       = m.bobotTesting > 0 ? (m.bobotDone / m.bobotTesting) * 100 : 0
    const scorePilot       = normalizeToScore(m.pilotCount, maxPilot)
    const scoreTicketClose = m.totalTicket > 0 ? (m.closedTicket / m.totalTicket) * 100 : 0
    const scoreTotalDok    = normalizeToScore(m.totalDok, maxDok)

    const totalScore = Math.round(
      scoreDoneRate    * WEIGHTS.doneRate +
      scoreBobot       * WEIGHTS.bobot +
      scorePilot       * WEIGHTS.pilot +
      scoreTicketClose * WEIGHTS.ticketClose +
      scoreTotalDok    * WEIGHTS.totalDok
    )

    const grade: "A"|"B"|"C"|"D" =
      totalScore >= GRADE_CONFIG.A.min ? "A" :
      totalScore >= GRADE_CONFIG.B.min ? "B" :
      totalScore >= GRADE_CONFIG.C.min ? "C" : "D"

    const cfg = GRADE_CONFIG[grade]

    return {
      ...m, scoreDoneRate, scoreBobot, scorePilot, scoreTicketClose, scoreTotalDok,
      totalScore, grade,
      gradeColor: cfg.color, gradeBg: cfg.bg, gradeText: cfg.text, gradeEmoji: cfg.emoji,
      rank: 0,
    } as GradeResult
  })

  // Sort by score descending and assign rank
  const sorted = [...withScores].sort((a, b) => b.totalScore - a.totalScore)
  sorted.forEach((m, i) => { m.rank = i + 1 })

  // Return in original order but with rank
  return withScores.map(m => sorted.find(s => s.name === m.name)!)
}