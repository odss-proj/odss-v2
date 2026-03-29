"use client"

import { useState } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("MDM")

  const handleRegister = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) return alert(error.message)

    // simpan role
    await supabase.from("profiles").insert({
      id: data.user?.id,
      email,
      role,
    })

    alert("Register berhasil!")
    router.push("/login")
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-green-400 to-teal-500">
      <div className="bg-white p-8 rounded-2xl w-[400px]">
        <h1 className="text-xl font-bold text-center">Register</h1>

        <input
          placeholder="Email"
          className="border p-2 w-full mt-4"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full mt-2"
          onChange={(e) => setPassword(e.target.value)}
        />

        <select
          className="border p-2 w-full mt-2"
          onChange={(e) => setRole(e.target.value)}
        >
          <option>MDM</option>
          <option>APPS</option>
          <option>APPC</option>
          <option>BR</option>
          <option>APPG</option>
          <option>DEV</option>
        </select>

        <button
          onClick={handleRegister}
          className="bg-green-500 text-white w-full mt-4 p-2 rounded"
        >
          Register
        </button>
      </div>
    </div>
  )
}