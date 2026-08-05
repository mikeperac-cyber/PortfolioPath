import { TemplateGenerationProvider } from "./template-provider"
import type { GenerationProvider } from "./types"
export function getGenerationProvider(): GenerationProvider { return new TemplateGenerationProvider() }
export * from "./types"
