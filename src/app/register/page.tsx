"use client"

import { useState } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"
import "../globals.css"

export default function RegisterPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("MDM")
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    const user = data.user
    console.log("REGISTER USER:", user)

    if (user) {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        role: role.toUpperCase(), // 🔥 biar konsisten
      })

      if (insertError) {
        alert("Gagal simpan profile: " + insertError.message)
        setLoading(false)
        return
      }
    }

    alert("Register berhasil! Silakan login.")
    router.push("/login")
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-green-400 to-teal-500">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-[350px]">
        <h2 className="text-2xl font-bold text-center mb-6">Register</h2>

        <input
          className="w-full mb-3 p-2 border rounded"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full mb-3 p-2 border rounded"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="">Pilih Role</option>
          <option value="MDM">MDM</option>
          <option value="APPC">APPC</option>
          <option value="APPT">APPT</option>
          <option value="APPG">APPG</option>
          <option value="BR">BR</option>
          <option value="DEV">DEV</option>
        </select>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          {loading ? "Loading..." : "Register"}
        </button>

        <p className="text-sm text-center mt-4">
          Sudah punya akun?{" "}
          <a href="/login" className="text-green-600">
            Login
          </a>
        </p>
      </div>
    </div>
  )
}