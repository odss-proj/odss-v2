"use client"

import { useState } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"
import "../globals.css"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    const user = data.user
    console.log("LOGIN USER:", user)

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      console.log("PROFILE:", profile)

      if (profileError || !profile) {
        alert("Profile tidak ditemukan!")
        setLoading(false)
        return
      }

      const role = profile.role?.toUpperCase()
      console.log("ROLE:", role)

      if (role === "MDM") router.push("/dashboard/mdm")
      else if (role === "APPC") router.push("/dashboard/appc")
      else if (role === "SH-APPS") router.push("/dashboard/apps")
      else if (role === "APPG") router.push("/dashboard/appg")
      else if (role === "BR") router.push("/dashboard/br")
      else if (role === "DEV") router.push("/dashboard/dev")
      else if (role === "SUPERADMIN") router.push("/superadmin")
      else if (role === "SH-APPS") router.push("/dashboard/apps")
    }

    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin()
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-green-400 to-teal-500">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-[350px]">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

        <input
          className="w-full mb-3 p-2 border rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <input
          className="w-full mb-4 p-2 border rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          {loading ? "Loading..." : "Login"}
        </button>

        <p className="text-sm text-center mt-4">
          Belum punya akun?{" "}
          <a href="/register" className="text-green-600">
            Register
          </a>
        </p>
      </div>
    </div>
  )
}