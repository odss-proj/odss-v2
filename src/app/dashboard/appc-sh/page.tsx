"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUserRole } from "../../../lib/get-user-role"
import DashboardAppcSH from "../../../components/dashboard/DashboardAppcSH"

export default function AppcSHPage() {
  const router = useRouter()

  useEffect(() => {
    const checkRole = async () => {
      const role = await getUserRole()
      if (!role) return
      const r = role.toUpperCase()
      if (r !== "SH-APPC") {
        if (r === "MDM") router.push("/dashboard/mdm")
        else if (r === "SH-APPS") router.push("/dashboard/apps")
        else if (r === "SUPERADMIN") router.push("/superadmin")
      }
    }
    checkRole()
  }, [])

  return <DashboardAppcSH />
}
