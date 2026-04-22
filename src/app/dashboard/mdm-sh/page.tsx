"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUserRole } from "../../../lib/get-user-role"
import DashboardMdmSH from "../../../components/dashboard/DashboardMdmSH"

export default function MdmSHPage() {
  const router = useRouter()

  useEffect(() => {
    const checkRole = async () => {
      const role = await getUserRole()
      if (!role) return
      const r = role.toUpperCase()
      if (r !== "SH-MDM") {
        if (r === "SH-APPS")  { window.location.href = "/dashboard/apps";    return }
        if (r === "SH-APPC")  { window.location.href = "/dashboard/appc-sh"; return }
        if (r === "SUPERADMIN") { window.location.href = "/superadmin";       return }
      }
    }
    checkRole()
  }, [])

  return <DashboardMdmSH />
}
