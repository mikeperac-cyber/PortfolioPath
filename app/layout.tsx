import type { Metadata } from "next"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import "@fontsource/inter/400.css"
import "@fontsource/inter/500.css"
import "@fontsource/inter/600.css"
import "@fontsource/sora/500.css"
import "@fontsource/sora/600.css"
import "./globals.css"

export const metadata: Metadata = {
  title: { default: "PortfolioPath", template: "%s · PortfolioPath" },
  description: "Build documented university portfolio projects—not artificial extracurricular activities.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body className="antialiased"><TooltipProvider><a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>{children}<Toaster richColors /></TooltipProvider></body></html>
}
