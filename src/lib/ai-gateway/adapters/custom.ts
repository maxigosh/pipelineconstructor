import type { LLMAdapter, UnifiedRequest } from "../types"
import { openaiAdapter } from "./openai"

export const customAdapter: LLMAdapter = {
  formatRequest(req: UnifiedRequest) {
    if (!req.baseUrl) {
      throw new Error("Custom provider requires a baseUrl")
    }

    // Use OpenAI-compatible format with the custom base URL
    return openaiAdapter.formatRequest({
      ...req,
      baseUrl: req.baseUrl,
    })
  },

  parseResponse(raw: any) {
    // Use OpenAI-compatible response parsing
    return openaiAdapter.parseResponse(raw)
  },
}
