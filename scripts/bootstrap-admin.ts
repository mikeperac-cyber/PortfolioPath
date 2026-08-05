import { createClient } from "@supabase/supabase-js"
const email=process.env.BOOTSTRAP_ADMIN_EMAIL;const password=process.env.BOOTSTRAP_ADMIN_PASSWORD;const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.SUPABASE_SECRET_KEY??process.env.SUPABASE_SERVICE_ROLE_KEY
if(!email||!password||!url||!key)throw new Error("Set BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD, NEXT_PUBLIC_SUPABASE_URL, and SUPABASE_SECRET_KEY (or the legacy SUPABASE_SERVICE_ROLE_KEY).")
const admin=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}})
const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:"PortfolioPath Administrator"}})
if(error)throw error
const {error:updateError}=await admin.from("users").update({role:"administrator",status:"active"}).eq("id",data.user.id)
if(updateError)throw updateError
process.stdout.write(`Administrator created: ${email}\n`)
