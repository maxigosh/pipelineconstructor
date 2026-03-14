import type { LLMAdapter, UnifiedRequest } from "../types"

export const openaiAdapter: LLMAdapter = {
  formatRequest(req: UnifiedRequest) {
    const baseUrl = req.baseUrl || "https://api.openai.com"
    const url = `${baseUrl}/v1/chat/completions`

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${req.apiKey}`,
    }

    const body: Record<string, any> = {
      model: req.model,
      messages: req.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }

    if (req.config.temperature !== undefined) body.temperature = req.config.temperature
    if (req.config.max_tokens !== undefined) body.max_tokens = req.config.max_tokens
    if (req.config.top_p !== undefined) body.top_p = req.config.top_p
    if (req.config.frequency_penalty !== undefined) body.frequency_penalty = req.config.frequency_penalty
    if (req.config.stop !== undefined) body.stop = req.config.stop
    if (req.config.response_format !== undefined) body.response_format = req.config.response_format

    return { url, headers, body }
  },

  parseResponse(raw: any) {
    const content = raw.choices?.[0]?.message?.content ?? ""
    const prompt = raw.usage?.prompt_tokens ?? 0
    const completion = raw.usage?.completion_tokens ?? 0

    return {
      content,
      tokens: {
        prompt,
        completion,
        total: prompt + completion,
      },
    }
  },
}
