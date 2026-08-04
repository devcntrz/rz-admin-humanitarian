import type React from "react"
import type { Metadata } from "next"
import { Source_Sans_3, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "RZ Humanitarian Admin",
  description: "Panel admin pencatatan aktivitas relawan",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body className={`font-sans ${sourceSans.variable} ${inter.variable} antialiased`}>
        <Suspense fallback={<div>Loading...</div>}>
          {children}
          <Analytics />
          <Toaster />
        </Suspense>
      </body>
    </html>
  )
}
