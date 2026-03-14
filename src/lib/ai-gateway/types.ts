export interface UnifiedMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface UnifiedRequest {
  provider: string
  model: string
  messages: UnifiedMessage[]
  config: {
    temperature?: number
    max_tokens?: number
    top_p?: number
    frequency_penalty?: number
    stop?: string[]
    response_format?: { type: "text" | "json_object" }
  }
  apiKey: string
  baseUrl?: string
}

export interface UnifiedResponse {
  content: string
  tokens: {
    prompt: number
    completion: number
    total: number
  }
  latency_ms: number
  raw: any
}

export interface LLMAdapter {
  formatRequest(req: UnifiedRequest): { url: string; headers: Record<string, string>; body: any }
  parseResponse(raw: any): { content: string; tokens: { prompt: number; completion: number; total: number } }
}
