import { createHmac } from "node:crypto";

/** Builds the documented IYZWSv2 Authorization header without storing payment data. */
export function buildIyzicoAuthorization(input: {
  apiKey: string;
  secretKey: string;
  randomKey: string;
  path: string;
  bodyText: string;
}) {
  const signature = createHmac("sha256", input.secretKey)
    .update(`${input.randomKey}${input.path}${input.bodyText}`)
    .digest("hex");
  const payload = `apiKey:${input.apiKey}&randomKey:${input.randomKey}&signature:${signature}`;
  return `IYZWSv2 ${Buffer.from(payload).toString("base64")}`;
}
