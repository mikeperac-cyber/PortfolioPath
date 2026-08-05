import { notFound } from "next/navigation"
import { PublicContentPage } from "@/components/public-content-page"
const pages = new Set(["how-it-works","students","counselors","pricing","ethical-use","privacy","terms"])
export default async function Page({ params }:{params:Promise<{locale:string;slug:string}>}) { const {locale,slug}=await params; if(!pages.has(slug)) notFound(); return <PublicContentPage locale={locale} slug={slug}/> }
