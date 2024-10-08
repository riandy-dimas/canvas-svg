import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CANVAS_CONFIG } from '@/utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SVG Template Generator',
  description: 'Generated by create next app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-theme="autumn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link href={CANVAS_CONFIG.fontUrl} rel="stylesheet" />
      </head>
      <body
        className={
          inter.className + ' h-screen flex items-center justify-center'
        }
      >
        {children}
      </body>
    </html>
  )
}
