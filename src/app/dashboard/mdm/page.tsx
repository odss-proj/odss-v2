"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUserRole } from "../../../lib/get-user-role"
import DashboardMdm from "../../../components/dashboard/DashboardMdm"

export default function MDMPage() {
  const router = useRouter()

  useEffect(() => {
    const checkRole = async () => {
      const role = await getUserRole()

      if (!role) return

      if (role !== "MDM") {
        if (role === "APPC") router.push("/dashboard/appc")
        if (role === "APPT") router.push("/dashboard/appt")
      }
    }

    checkRole()
  }, [])

  const config = {
    name: "MDM",
    kpi: [
      { title: "Total KPI", value: "16" },
      { title: "Total Bobot", value: "100" },
      { title: "Total Done", value: "60" },
      { title: "Total Pending", value: "10" },
    ],
  }

  return <DashboardMdm config={config} />
}