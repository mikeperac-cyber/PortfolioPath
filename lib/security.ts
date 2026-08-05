import { createHash, randomBytes } from "node:crypto"

const unsupportedSuperlatives = /\b(best|greatest|unprecedented|revolutionary|world[- ]class|guaranteed|life[- ]changing|massive impact)\b/gi
export function sanitizePlainText(value: string) { return value.replace(/[<>]/g, "").trim() }
export function findUnsupportedClaims(value: string) { return [...new Set(value.match(unsupportedSuperlatives)?.map((x) => x.toLowerCase()) ?? [])] }
export function assertSafeExternalUrl(value: string) { const url = new URL(value); if (!["https:", "http:"].includes(url.protocol)) throw new Error("Only HTTP(S) links are accepted."); return url.toString() }
export function createShareToken() { return randomBytes(32).toString("base64url") }
export function hashShareToken(token: string) { return createHash("sha256").update(`${token}:${process.env.SHARE_TOKEN_SECRET ?? "development-only"}`).digest("hex") }
export function createInvitationToken() { return randomBytes(32).toString("base64url") }
export function hashInvitationToken(token: string) { return createHash("sha256").update(`relationship-invite:${token}:${process.env.SHARE_TOKEN_SECRET ?? "development-only"}`).digest("hex") }
export function hashInput(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex") }
export function isShareLinkUsable(link:{expiresAt:string|Date;revokedAt?:string|Date|null},now=new Date()){return !link.revokedAt&&new Date(link.expiresAt).getTime()>now.getTime()}
export function filterVerifiedSources<T extends {id:string}>(records:T[],allowedIds:string[]){const allowed=new Set(allowedIds);return records.filter(record=>allowed.has(record.id))}
