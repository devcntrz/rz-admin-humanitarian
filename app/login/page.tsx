"use client"

import { signIn } from "next-auth/react"
import Image from "next/image"
import { useState } from "react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  const handleGoogle = async () => {
    try {
      setLoading(true)
      await signIn("google", { callbackUrl: "/admin" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-rose-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="relative h-14 w-14">
              <Image src="/images/rz_whote.png" alt="RZ" fill sizes="56px" className="object-contain" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">RZ Humanitarian Admin</h1>
            <p className="text-sm text-muted-foreground">Silakan login menggunakan akun Google yang terdaftar sebagai admin.</p>
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-3 border rounded-lg py-2.5 px-4 hover:bg-muted transition-colors disabled:opacity-70"
          >
            <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={20} height={20} />
            {loading ? "Mengalihkan..." : "Masuk dengan Google"}
          </button>
        </div>
        <div className="px-8 py-4 bg-muted/30 text-xs text-muted-foreground">
          Hanya email yang terdaftar di tabel admins yang diizinkan.
        </div>
      </div>
    </div>
  )
}


