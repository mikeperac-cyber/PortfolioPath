import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { Brand } from "@/components/brand"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Button } from "@/components/ui/button"

export async function MarketingHeader({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "nav" })
  const shortStart = locale === "tr" ? t("start") : "Start"

  return (
    <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/88">
      <div className="h-1 bg-accent" />
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5 lg:px-8">
        <div className="shrink-0">
          <Brand locale={locale} />
        </div>
        <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Primary">
          <Link href={`/${locale}/how-it-works`} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary">{t("how")}</Link>
          <Link href={`/${locale}/students`} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary">{t("students")}</Link>
          <Link href={`/${locale}/counselors`} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary">{t("counselors")}</Link>
          <Link href={`/${locale}/schools`} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary">{locale === "tr" ? "Okullar" : "Schools"}</Link>
          <Link href={`/${locale}/pricing`} className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary">{t("pricing")}</Link>
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" asChild className="hidden h-10 px-4 font-medium sm:inline-flex">
            <Link href={`/${locale}/login`}>{t("login")}</Link>
          </Button>
          <Button asChild className="h-10 px-3 text-sm font-semibold min-[420px]:px-5">
            <Link href={`/${locale}/register`}>
              <span className="min-[420px]:hidden">{shortStart}</span>
              <span className="hidden min-[420px]:inline">{t("start")}</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
