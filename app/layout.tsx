import type { Metadata } from "next"
import { Inter, Sora } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
})

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["500", "600"],
})

export const metadata: Metadata = {
  title: { default: "PortfolioPath", template: "%s · PortfolioPath" },
  description: "Build documented university portfolio projects—not artificial extracurricular activities.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${sora.variable}`}>
      <body className="antialiased">
        <TooltipProvider>
          <a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>
          {children}
          <Toaster richColors />
        </TooltipProvider>
      </body>
    </html>
  )
}
