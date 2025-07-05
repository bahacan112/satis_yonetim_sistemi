import type React from "react"
import type { Metadata } from "next"
// The dynamic `next/font/google` loader causes a runtime
// fetch for a blob that doesn't exist in the next-lite FS.
// We switch to Tailwind's default sans-serif stack instead.
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { I18nProvider } from "@/contexts/i18n-context"

export const metadata: Metadata = {
  title: "Satış Yönetim Sistemi",
  description: "Mağaza satış yönetim sistemi",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      {/* Use Tailwind's default font stack */}
      <body className="font-sans antialiased">
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
