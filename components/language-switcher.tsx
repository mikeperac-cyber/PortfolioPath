"use client"
import { useLocale } from "next-intl"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function LanguageSwitcher() {
  const locale = useLocale(), pathname = usePathname(), router = useRouter()
  const next = locale === "en" ? "tr" : "en"
  return <Button variant="ghost" size="sm" onClick={() => router.push(pathname.replace(`/${locale}`, `/${next}`))} aria-label={`Switch to ${next === "en" ? "English" : "Turkish"}`}>{locale.toUpperCase()} / {next.toUpperCase()}</Button>
}
