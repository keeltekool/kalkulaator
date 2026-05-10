import type { Metadata } from "next"
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
})

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Automaksu kalkulaator | Kalku",
  description: "Arvuta oma sõiduki aastamaks ja registreerimistasu. Eesti mootorsõidukimaksu kalkulaator 2025/2026.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="et" className={`${jakarta.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `try{const t=localStorage.getItem('kalku-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`
        }} />
      </head>
      <body style={{ fontFamily: "var(--font-jakarta), var(--font-sans)" }}>{children}</body>
    </html>
  )
}
