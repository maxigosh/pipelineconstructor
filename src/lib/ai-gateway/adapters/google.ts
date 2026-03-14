import type { LLMAdapter, UnifiedRequest } from "../types"

export const googleAdapter: LLMAdapter = {
  formatRequest(req: UnifiedRequest) {
    const baseUrl = req.baseUrl || "https://generativelanguage.googleapis.com"
    const url = `${baseUrl}/v1beta/models/${req.model}:generateContent?key=${req.apiKey}`

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    // Convert messages to Gemini parts format
    const systemMessage = req.messages.find((m) => m.role === "system")
    const nonSystemMessages = req.messages.filter((m) => m.role !== "system")

    const contents = nonSystemMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }))

    const body: Record<string, any> = { contents }

    if (systemMessage) {
      body.systemInstruction = {
        parts: [{ text: systemMessage.content }],
      }
    }

    const generationConfig: Record<string, any> = {}
    if (req.config.temperature !== undefined) generationConfig.temperature = req.config.temperature
    if (req.config.max_tokens !== undefined) generationConfig.maxOutputTokens = req.config.max_tokens
    if (req.config.top_p !== undefined) generationConfig.topP = req.config.top_p
    if (req.config.stop !== undefined) generationConfig.stopSequences = req.config.stop
    if (req.config.response_format?.type === "json_object") {
      generationConfig.responseMimeType = "application/json"
    }

    if (Object.keys(generationConfig).length > 0) {
      body.generationConfig = generationConfig
    }

    return { url, headers, body }
  },

  parseResponse(raw: any) {
    const content = raw.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
    const prompt = raw.usageMetadata?.promptTokenCount ?? 0
    const completion = raw.usageMetadata?.candidatesTokenCount ?? 0

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
