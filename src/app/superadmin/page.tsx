"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"
import DashboardSuperadmin from "../../components/dashboard/DashboardSuperadmin"

export default function SuperadminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [userName, setUserName] = useState("superadmin")

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, email")
        .eq("id", user.id)
        .single()

      console.log("SUPERADMIN PROFILE:", profile, profileError)

      if (!profile || profile.role?.toUpperCase() !== "SUPERADMIN") {
        router.push("/login")
        return
      }

      if (profile.email) setUserName(profile.email.split("@")[0])
      setAuthorized(true)
    }
    checkRole()
  }, [])

  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Memuat dashboard...</p>
      </div>
    )
  }

  return <DashboardSuperadmin userName={userName} />
}
