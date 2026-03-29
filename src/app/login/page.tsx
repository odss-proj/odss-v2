"use client"

import { useState } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) return alert(error.message)

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single()

    const role = profile?.role
    router.push(`/dashboard/${role?.toLowerCase()}`)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-400 to-teal-500">

      {/* CARD */}
      <div className="bg-white w-[380px] p-8 rounded-2xl shadow-sm hover:shadow-md-2xl">

        {/* LOGO */}
        <h1 className="text-4xl font-bold text-center text-green-600">
          ODSS
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Selamat datang di ODSS
        </p>

        {/* INPUT EMAIL */}
        <input
          type="email"
          placeholder="Masukkan email"
          className="w-full mt-6 p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400"
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* INPUT PASSWORD */}
        <input
          type="password"
          placeholder="Masukkan password"
          className="w-full mt-3 p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400"
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* BUTTON */}
        <button
          onClick={handleLogin}
          className="w-full mt-6 bg-gradient-to-r from-green-500 to-teal-500 text-white p-3 rounded-2xl font-semibold hover:opacity-90 transition"
        >
          Login
        </button>

      </div>
    </div>
  )
}