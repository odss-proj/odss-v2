"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getUserRole } from "../../../lib/get-user-role"

export default function APPCPage() {
  const router = useRouter()

  useEffect(() => {
    const checkRole = async () => {
      const role = await getUserRole()

      console.log("ROLE:", role)

      if (!role) return

      if (role !== "APPC") {
        if (role === "MDM") {
          router.push("/dashboard/mdm")
        } else if (role === "APPT") {
          router.push("/dashboard/appt")
        }
      }
    }

    checkRole()
  }, [])

  return <div>Dashboard APPC</div>
}