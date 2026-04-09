"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUserRole } from "../../../lib/get-user-role"
import DashboardDev from "../../../components/dashboard/DashboardDev"

export default function DevPage() {
  const router = useRouter()

  useEffect(() => {
    const checkRole = async () => {
      const role = await getUserRole()

      if (!role) return

      if (role === "MDM")  router.push("/dashboard/mdm")
      if (role === "APPC") router.push("/dashboard/appc")
      if (role === "APPT") router.push("/dashboard/appt")
    }

    checkRole()
  }, [router])

  return <DashboardDev />
}
