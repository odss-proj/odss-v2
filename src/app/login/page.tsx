"use client"

import { useState } from "react"
import Image from "next/image"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"
import "../globals.css"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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

      // 🔥 REDIRECT BERDASARKAN ROLE
      if (role === "MDM") router.push("/dashboard/mdm")
      else if (role === "APPC") router.push("/dashboard/appc")
      else if (role === "APPT") router.push("/dashboard/appt")
      else if (role === "APPG") router.push("/dashboard/appg")
      else if (role === "BR") router.push("/dashboard/br")
      else if (role === "DEV") router.push("/dashboard/dev")
    }

    setLoading(false)
  }

  // ✅ FIX 1: Handle Enter key press to trigger login
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin()
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-400 via-green-400 to-green-500">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-[380px]">

        {/* ✅ FIX 2: ODSS Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/logo_odss.png"
            alt="Logo ODSS"
            width={180}
            height={80}
            priority
            className="h-auto"
          />
        </div>

        <h2 className="text-xl font-bold text-center text-green-600 mb-1">
          Selamat Datang di ODSS
        </h2>
        <p className="text-sm text-center text-gray-400 mb-6">
          Silahkan masuk untuk memulai
        </p>

        <label className="block text-sm font-medium text-gray-600 mb-1">Username</label>
        <input
          className="w-full mb-4 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
          placeholder="Masukkan username Anda"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
        <div className="relative mb-6">
          <input
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm pr-10"
            type={showPassword ? "text" : "password"}
            placeholder="Masukkan password Anda"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white py-2.5 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-60"
        >
          {loading ? "Loading..." : "Login"}
        </button>

        <p className="text-sm text-center mt-4 text-gray-500">
          Belum punya akun?{" "}
          <a href="/register" className="text-green-600 font-medium hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  )
}