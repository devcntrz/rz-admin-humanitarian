"use client"

import { useEffect } from "react"

/** Hides admin chrome so print pages render as a clean document preview. */
export function PrintAuto() {
  useEffect(() => {
    document.body.classList.add("print-page-mode")
    return () => {
      document.body.classList.remove("print-page-mode")
    }
  }, [])

  return null
}
