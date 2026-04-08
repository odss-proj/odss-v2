type LeaderboardEntry = {
  name: string
  score: number
}

type Props = {
  data?: LeaderboardEntry[]
}

const RANK_COLORS = ["bg-yellow-400", "bg-gray-300", "bg-orange-400"]
const RANK_EMOJI = ["🥇", "🥈", "🥉"]


export default function Leaderboard({ data = [] }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-5 rounded-2xl border shadow-sm">
        <h2 className="font-semibold mb-4">Leaderboard MDM</h2>
        <p className="text-sm text-gray-400 text-center py-4">Belum ada data</p>
      </div>
    )
  }

  const top3 = data.slice(0, 3)
  const rest = data.slice(3)

  return (
    <div className="bg-white p-5 rounded-2xl border shadow-sm">
      <h2 className="font-semibold mb-4">Leaderboard MDM</h2>
      <div className="space-y-3">
        {top3.map((u, i) => (
          <div key={u.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full ${RANK_COLORS[i]} flex items-center justify-center text-sm font-bold`}>
                {RANK_EMOJI[i]}
              </div>
              <div>
                <p className="text-sm font-medium">{u.name.charAt(0).toUpperCase() + u.name.slice(1).toLowerCase()}</p>
                <p className="text-xs text-gray-400">Score {u.score.toFixed(1)}</p>
              </div>
            </div>
            <span className="text-sm font-semibold text-green-600">{u.score.toFixed(1)}</span>
          </div>
        ))}
        {rest.map((u, i) => (
          <div key={u.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                {i + 4}
              </div>
              <div>
                <p className="text-sm">{u.name.charAt(0).toUpperCase() + u.name.slice(1).toLowerCase()}</p>
                <p className="text-xs text-gray-400">Score {u.score.toFixed(1)}</p>
              </div>
            </div>
            <span className="text-sm text-gray-500">{u.score.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}