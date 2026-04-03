"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUserRole } from "../../../lib/get-user-role"
import DashboardAppc from "../../../components/dashboard/DashboardAppc"

export default function APPCPage() {
  const router = useRouter()

  useEffect(() => {
    const checkRole = async () => {
      const role = await getUserRole()

      if (!role) return

      if (role !== "APPC") {
        if (role === "MDM") router.push("/dashboard/mdm")
        if (role === "APPT") router.push("/dashboard/appt")
      }
    }

    checkRole()
  }, [])

  return <DashboardAppc />
}