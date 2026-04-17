"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUserRole } from "../../../lib/get-user-role"
import DashboardGlobal from "../../../components/dashboard/DashboardGlobal"

export default function GlobalPage() {
  const router = useRouter()

  useEffect(() => {
    const checkRole = async () => {
      const role = await getUserRole()

      if (!role) return

      if (role === "MDM")  router.push("/dashboard/mdm")
      if (role === "APPC") router.push("/dashboard/appc")
      if (role === "APPT") router.push("/dashboard/apps")
    }

    checkRole()
  }, [router])

  return <DashboardGlobal />
}
