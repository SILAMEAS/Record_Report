// Remove 'use client' directive from here, since `metadata` is server-side logic
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Metadata is a server-side only export
export const metadata = {
  title: 'Content Management with Cloudinary',
  description: 'A Next.js application for managing content with Cloudinary images',
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
