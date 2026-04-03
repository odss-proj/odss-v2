export default function Tabs() {
  const tabs = [
    "Home",
    "Data Transfer",
    "Perform. Analytics",
    "Owncloud",
    "Area Cover",
    "Backlog",
  ]

  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map((tab, i) => (
        <button
          key={i}
          className={`px-4 py-2 rounded-full text-sm ${
            i === 0
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}