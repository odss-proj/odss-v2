import Sidebar from "../../components/sidebar"
import { Bell, Search } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">

      <Sidebar />

      <div className="flex-1 flex flex-col">

    <div className="bg-white px-6 py-4 border-b flex justify-between items-center">

    {/* LEFT */}
    <div className="flex items-center gap-6">

        {/* TITLE */}
        <div>
        <p className="text-sm text-gray-400">
            Good Afternoon, Napoleon!
        </p>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        </div>

        {/* SEARCH */}
        <div className="flex items-center bg-gray-100 px-3 py-2 rounded-lg w-64">
        <Search size={16} className="text-gray-500" />
        <input
            className="bg-transparent outline-none ml-2 text-sm w-full"
            placeholder="Search..."
        />
        </div>

    </div>

    {/* RIGHT */}
    <div className="flex items-center gap-4">

        <div className="p-2 rounded-full border hover:bg-gray-100 cursor-pointer">
        <Bell size={18} className="text-gray-600" />
        </div>

        <div className="flex items-center gap-2">
        <div className="w-9 h-9 bg-green-500 rounded-full" />
        <span className="text-sm font-medium">Kevin</span>
        </div>

    </div>

    </div>

        <div className="p-6">{children}</div>

      </div>
    </div>
  )
}