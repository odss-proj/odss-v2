"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function Header() {
  const [userName, setUserName] = useState("User")
  const [role, setRole] = useState("")

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single()

      if (data) {
        setUserName(data.full_name || "User")
        setRole(data.role)
      }
    }

    getUser()
  }, [])

  return (
    <div className="bg-white px-6 py-4 border-b flex justify-between items-center">

      {/* LEFT */}
      <div>
        <p className="text-gray-500">
          Good Afternoon, {userName} 👋
        </p>
        <h1 className="text-xl font-semibold capitalize">
          {role} Dashboard
        </h1>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 bg-green-500 rounded-full" />
        <span className="text-sm font-medium">{userName}</span>
      </div>

    </div>
  )
}