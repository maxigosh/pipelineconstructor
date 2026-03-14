import type { LLMAdapter, UnifiedRequest, UnifiedResponse } from "./types"
import { openaiAdapter } from "./adapters/openai"
import { anthropicAdapter } from "./adapters/anthropic"
import { googleAdapter } from "./adapters/google"
import { customAdapter } from "./adapters/custom"

export type { UnifiedRequest, UnifiedResponse, UnifiedMessage, LLMAdapter } from "./types"

const adapters: Record<string, LLMAdapter> = {
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  google: googleAdapter,
  mistral: openaiAdapter, // Mistral uses OpenAI-compatible API
  groq: openaiAdapter, // Groq uses OpenAI-compatible API
  openrouter: openaiAdapter, // OpenRouter uses OpenAI-compatible API
  custom: customAdapter,
}

const defaultBaseUrls: Record<string, string> = {
  openai: "https://api.openai.com",
  anthropic: "https://api.anthropic.com",
  google: "https://generativelanguage.googleapis.com",
  mistral: "https://api.mistral.ai",
  groq: "https://api.groq.com/openai",
  openrouter: "https://openrouter.ai/api",
}

export async function callLLM(request: UnifiedRequest): Promise<UnifiedResponse> {
  const adapter = adapters[request.provider]
  if (!adapter) {
    throw new Error(`Unsupported provider: ${request.provider}`)
  }

  // Apply default base URL if not provided
  const reqWithDefaults: UnifiedRequest = {
    ...request,
    baseUrl: request.baseUrl || defaultBaseUrls[request.provider],
  }

  const { url, headers, body } = adapter.formatRequest(reqWithDefaults)

  const startTime = Date.now()

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    let errorMessage: string
    try {
      const parsed = JSON.parse(errorBody)
      errorMessage =
        parsed.error?.message ||
        parsed.error?.type ||
        parsed.message ||
        errorBody
    } catch {
      errorMessage = errorBody
    }
    throw new Error(`LLM API error (${response.status}): ${errorMessage}`)
  }

  const raw = await response.json()
  const latency_ms = Date.now() - startTime

  const { content, tokens } = adapter.parseResponse(raw)

  return {
    content,
    tokens,
    latency_ms,
    raw,
  }
}
