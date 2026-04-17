"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUserRole } from "../../../lib/get-user-role"
import DashboardApps from "../../../components/dashboard/DashboardApps"

export default function APPCPage() {
  const router = useRouter()

  useEffect(() => {
    const checkRole = async () => {
      const role = await getUserRole()
      if (!role) return
      const r = role.toUpperCase()
      if (r !== "SH-APPS") {
        if (r === "MDM") router.push("/dashboard/mdm")
        else if (r === "APPC") router.push("/dashboard/appc")
        else if (r === "SUPERADMIN") router.push("/superadmin")
      }
    }
    checkRole()
  }, [])

  return <DashboardApps/>
}