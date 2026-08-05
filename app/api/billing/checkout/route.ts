import { NextResponse } from "next/server"
import { z } from "zod"
import { getApiContext, invalid } from "@/lib/api-auth"
import { getPaymentProvider } from "@/lib/payments"
const schema=z.object({planCode:z.enum(["blueprint","complete","counselor"]),locale:z.enum(["en","tr"]).default("en")})
export async function POST(request:Request){try{const input=schema.parse(await request.json());const context=await getApiContext();if(context.error)return context.error;if(input.planCode==="counselor"&&context.user.role!=="counselor")return NextResponse.json({error:"This plan is for counselors."},{status:403});if(input.planCode!=="counselor"&&context.user.role!=="student")return NextResponse.json({error:"This plan is for students."},{status:403});const origin=new URL(request.url).origin;const provider=getPaymentProvider();const checkout=await provider.createCheckout({userId:context.user.id,email:context.user.email,planCode:input.planCode,successUrl:`${origin}/${input.locale}/${context.user.role}/subscription`,cancelUrl:`${origin}/${input.locale}/pricing`});return NextResponse.json(checkout)}catch(error){return invalid(error)}}
