"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRightIcon, LoaderCircleIcon } from "lucide-react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { useForm, useWatch, type Resolver } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { loginSchema, signupSchema } from "@/lib/validation"

type SignupValues = z.infer<typeof signupSchema>

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const params = useParams<{ locale: string }>()
  const locale = params.locale === "tr" ? "tr" : "en"
  const search = useSearchParams()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const selectedRole = search.get("role") === "counselor" ? "counselor" : "student"
  const requestedNext = search.get("next")
  const safeNext = requestedNext?.startsWith(`/${locale}/`) ? requestedNext : null
  const form = useForm<SignupValues>({
    resolver: zodResolver(mode === "login" ? loginSchema : signupSchema) as unknown as Resolver<SignupValues>,
    defaultValues: { fullName: "", email: "", password: "", role: selectedRole, locale },
  })
  const accountRole = useWatch({ control: form.control, name: "role" })

  async function submit(values: SignupValues) {
    setBusy(true)
    const supabase = createClient()
    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password })
      if (error) { toast.error(error.message); setBusy(false); return }
      const [{ data: profile }, { data: grants }] = await Promise.all([
        supabase.from("users").select("role,status").eq("id", data.user.id).single(),
        supabase.from("user_role_grants").select("role").eq("user_id", data.user.id).eq("active", true).is("revoked_at", null),
      ])
      if (profile?.status === "suspended") { router.push(`/${locale}/account-suspended`); return }
      const roles = new Set([profile?.role, ...(grants ?? []).map((grant) => grant.role)])
      const home = roles.has("platform_owner") ? "owner" : roles.has("administrator") ? "admin" : roles.has("counselor") ? "counselor" : roles.has("parent") ? "parent" : roles.has("mentor") ? "mentor" : roles.has("school_admin") || roles.has("school_counselor") ? "school" : "student"
      router.push(safeNext ?? `/${locale}/${home}/dashboard`)
      router.refresh()
      return
    }
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { full_name: values.fullName, requested_role: values.role, locale: values.locale }, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext ?? `/${locale}/${values.role}/dashboard`)}` },
    })
    if (error) { toast.error(error.message); setBusy(false); return }
    toast.success(values.role === "counselor" ? "Account created. Administrator approval is required." : "Account created. Check your email if confirmation is enabled.")
    router.push(`/${locale}/login`)
  }

  return <Card className="w-full max-w-lg shadow-sm">
    <CardHeader><CardTitle>{mode === "login" ? "Welcome back" : "Create your PortfolioPath account"}</CardTitle><CardDescription>{mode === "login" ? "Continue your documented project work." : "Your work stays private unless you choose to share it."}</CardDescription></CardHeader>
    <CardContent><form onSubmit={form.handleSubmit(submit)}><FieldGroup>
      {mode === "register" && <Field data-invalid={!!form.formState.errors.fullName}><FieldLabel htmlFor="fullName">Full name</FieldLabel><Input id="fullName" autoComplete="name" {...form.register("fullName")}/><FieldError errors={[form.formState.errors.fullName]}/></Field>}
      <Field data-invalid={!!form.formState.errors.email}><FieldLabel htmlFor="email">Email</FieldLabel><Input id="email" type="email" autoComplete="email" {...form.register("email")}/><FieldError errors={[form.formState.errors.email]}/></Field>
      <Field data-invalid={!!form.formState.errors.password}><FieldLabel htmlFor="password">Password</FieldLabel><Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} {...form.register("password")}/><FieldDescription>At least 8 characters with upper, lower, and number.</FieldDescription><FieldError errors={[form.formState.errors.password]}/></Field>
      {mode === "register" && <Field><FieldLabel>Account type</FieldLabel><div className="grid grid-cols-2 gap-3">{(["student","counselor"] as const).map(role => <Button key={role} type="button" variant={accountRole === role ? "default" : "outline"} onClick={() => form.setValue("role", role)}>{role === "student" ? "Student" : "Counselor"}</Button>)}</div>{accountRole === "counselor" && <FieldDescription>Administrator approval is required. Counselor accounts remain pending until approved.</FieldDescription>}</Field>}
      <Button type="submit" size="lg" disabled={busy}>{busy ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin"/> : <ArrowRightIcon data-icon="inline-end"/>}{mode === "login" ? "Log in" : "Create account"}</Button>
    </FieldGroup></form></CardContent>
  </Card>
}
