export const PROVIDERS = {
  openai: {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    models: ["gpt-4o", "gpt-4o-mini", "o3", "o4-mini"],
    color: "bg-green-500",
  },
  anthropic: {
    name: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1",
    models: ["claude-opus-4-6", "claude-sonnet-4-6"],
    color: "bg-orange-500",
  },
  google: {
    name: "Google",
    baseUrl: "https://generativelanguage.googleapis.com",
    models: ["gemini-2.5-pro", "gemini-2.5-flash"],
    color: "bg-blue-500",
  },
  mistral: {
    name: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    models: ["mistral-large", "mistral-medium"],
    color: "bg-purple-500",
  },
  groq: {
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    models: ["llama-3.3-70b", "mixtral-8x7b"],
    color: "bg-red-500",
  },
  openrouter: {
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    models: ["Any model via OpenRouter"],
    color: "bg-indigo-500",
  },
  custom: {
    name: "Custom",
    baseUrl: "",
    models: [],
    color: "bg-gray-500",
  },
} as const

export type ProviderKey = keyof typeof PROVIDERS

export function getProviderInfo(provider: string) {
  return PROVIDERS[provider as ProviderKey] || PROVIDERS.custom
}
