"use client"

import { Menu, Sun, Moon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useDarkMode } from "../../context/DarkModeContext"

export default function Header({
  toggleSidebar,
}: {
  toggleSidebar: () => void
}) {
  const pathname = usePathname()
  const { isDark, toggle } = useDarkMode()
  const [userName, setUserName] = useState("")
  const [greeting, setGreeting] = useState("")

  useEffect(() => {
    // Greeting by time
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good Morning")
    else if (hour < 15) setGreeting("Good Afternoon")
    else if (hour < 19) setGreeting("Good Evening")
    else setGreeting("Good Night")

    // Get logged in user name from email
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // Ambil nama dari email (sebelum @)
      const emailName = user.email?.split("@")[0] ?? ""
      // Capitalize
      const name = emailName.charAt(0).toUpperCase() + emailName.slice(1)
      setUserName(name)
    }
    getUser()
  }, [])

  const getTitle = () => {
    if (pathname.includes("coda")) return "Monitoring KPI › Coda"
    if (pathname.includes("logix")) return "Monitoring KPI › Logix"
    if (pathname.includes("dashboard")) return "Dashboard"
    return "Dashboard"
  }

  return (
    <div className="bg-white dark:bg-slate-900 px-6 py-4 border-b dark:border-slate-700 flex justify-between items-center">

      {/* LEFT */}
      <div className="flex items-center gap-4">
        <Menu
          className="cursor-pointer text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          onClick={toggleSidebar}
        />
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {greeting}{userName ? `, ${userName}` : ""} 👋
          </p>
          <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {getTitle()}
          </h1>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">

        {/* Dark Mode Toggle */}
        <button
          onClick={toggle}
          className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* User Avatar */}
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {userName ? userName.charAt(0).toUpperCase() : "U"}
        </div>
        <span className="font-medium text-gray-800 dark:text-gray-100">
          {userName || "User"}
        </span>
      </div>
    </div>
  )
}
