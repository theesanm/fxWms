
import { GeistSans, GeistMono } from 'geist/font'
import "./globals.css"
import { Auth } from "@/components/auth"
import ClientLayout from "@/app/client-layout"
import { ThemeProvider } from '@/components/theme-provider'

export const metadata = {
  title: "Admin Portal",
  description: "Administrative interface",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-secondary-light dark:bg-gray-900">
        <ThemeProvider>
          <Auth>
            {children}
          </Auth>
        </ThemeProvider>
      </body>
    </html>
  )
}


