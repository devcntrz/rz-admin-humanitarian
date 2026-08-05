"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal"

export function LogoutButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    try {
      setLoading(true)
      const csrfRes = await fetch("/api/auth/csrf")
      const { csrfToken } = await csrfRes.json()

      const form = document.createElement("form")
      form.method = "POST"
      form.action = "/api/auth/signout"

      const csrfInput = document.createElement("input")
      csrfInput.type = "hidden"
      csrfInput.name = "csrfToken"
      csrfInput.value = csrfToken
      form.appendChild(csrfInput)

      const callbackInput = document.createElement("input")
      callbackInput.type = "hidden"
      callbackInput.name = "callbackUrl"
      callbackInput.value = "/login"
      form.appendChild(callbackInput)

      document.body.appendChild(form)
      form.submit()
    } catch (error) {
      console.error("Logout failed:", error)
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Logout
      </Button>

      <Modal open={open} onOpenChange={setOpen}>
        <ModalContent className="max-w-sm">
          <ModalHeader>
            <ModalTitle>Konfirmasi Logout</ModalTitle>
            <ModalDescription>
              Apakah Anda yakin ingin keluar dari akun admin?
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Batal
            </Button>
            <Button onClick={handleLogout} disabled={loading}>
              {loading ? "Keluar..." : "Ya, Logout"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
