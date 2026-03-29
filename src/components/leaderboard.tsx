export default function Leaderboard() {
  const users = [
    { name: "Alexander The Great", point: 10000 },
    { name: "Gregorius Theodosian", point: 7000 },
    { name: "Scipio", point: 6700 },
  ]

  return (
    <div className="bg-white p-5 rounded-2xl border shadow-sm">

      <h2 className="font-semibold mb-4">Leaderboard MDM</h2>

      <div className="space-y-3">

        {users.map((u, i) => (
          <div key={i} className="flex items-center justify-between">

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                {i + 1}
              </div>

              <div>
                <p className="text-sm">{u.name}</p>
                <p className="text-xs text-gray-400">
                  {u.point.toLocaleString()} Point
                </p>
              </div>
            </div>

          </div>
        ))}

        {/* USER SENDIRI */}
        <div className="bg-green-500 text-white rounded-xl p-3 flex justify-between items-center">
          <span>Napoleon Bonaparte</span>
          <span>5.000 Point</span>
        </div>

      </div>

    </div>
  )
}