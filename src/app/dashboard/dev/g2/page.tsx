"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUserRole } from "../../../../lib/get-user-role"
import DashboardDev from "../../../../components/dashboard/DashboardDev"

export default function DevG2Page() {
  const router = useRouter()
  useEffect(() => {
    const check = async () => {
      const role = await getUserRole()
      if (!role) { router.push("/login"); return }
      const allowed = ["SH-DEVG2", "SUPERADMIN", "DEV"]
      if (!allowed.includes(role.toUpperCase())) router.push("/dashboard/dev")
    }
    check()
  }, [router])
  return <DashboardDev fixedGroup="G2" />
}