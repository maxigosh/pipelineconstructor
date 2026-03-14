import type { LLMAdapter, UnifiedRequest } from "../types"

export const anthropicAdapter: LLMAdapter = {
  formatRequest(req: UnifiedRequest) {
    const baseUrl = req.baseUrl || "https://api.anthropic.com"
    const url = `${baseUrl}/v1/messages`

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-api-key": req.apiKey,
      "anthropic-version": "2023-06-01",
    }

    // Separate system message from the rest
    const systemMessage = req.messages.find((m) => m.role === "system")
    const nonSystemMessages = req.messages.filter((m) => m.role !== "system")

    const body: Record<string, any> = {
      model: req.model,
      messages: nonSystemMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }

    if (systemMessage) {
      body.system = systemMessage.content
    }

    if (req.config.max_tokens !== undefined) {
      body.max_tokens = req.config.max_tokens
    } else {
      // Anthropic requires max_tokens
      body.max_tokens = 4096
    }

    if (req.config.temperature !== undefined) body.temperature = req.config.temperature
    if (req.config.top_p !== undefined) body.top_p = req.config.top_p
    if (req.config.stop !== undefined) body.stop_sequences = req.config.stop

    return { url, headers, body }
  },

  parseResponse(raw: any) {
    const content = raw.content?.[0]?.text ?? ""
    const prompt = raw.usage?.input_tokens ?? 0
    const completion = raw.usage?.output_tokens ?? 0

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
