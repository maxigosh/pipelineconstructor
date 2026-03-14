import { prisma } from "./prisma"
import { decrypt } from "./encryption"
import { callLLM } from "./ai-gateway"
import type { UnifiedMessage } from "./ai-gateway/types"

export interface StepResult {
  stepId: string
  stepOrder: number
  stepName: string
  status: "pending" | "running" | "completed" | "failed"
  output?: string
  mappedOutput?: string
  tokens?: { prompt: number; completion: number; total: number }
  latency_ms?: number
  error?: string
}

export interface PipelineProgress {
  type: "step_start" | "step_complete" | "step_error" | "run_complete"
  stepOrder: number
  data: StepResult | StepResult[]
}

interface PipelineStep {
  id: string
  order: number
  name: string
  system_prompt: string | null
  user_prompt: string
  provider: string
  model: string
  api_key_id: string | null
  config: any
  output_mapping: any
}

export class PipelineRunner {
  private steps: PipelineStep[]
  private input: Record<string, string>
  private results: StepResult[] = []
  private context: Record<string, string> = {}

  constructor(steps: PipelineStep[], input: Record<string, string>) {
    this.steps = steps.sort((a, b) => a.order - b.order)
    this.input = input
    // Initialize context with input values
    this.context = { ...input }
    if (input.input) {
      this.context["input"] = input.input
    }
  }

  async run(onProgress?: (progress: PipelineProgress) => void): Promise<StepResult[]> {
    for (const step of this.steps) {
      const stepResult: StepResult = {
        stepId: step.id,
        stepOrder: step.order,
        stepName: step.name,
        status: "running",
      }

      // Notify step start
      onProgress?.({
        type: "step_start",
        stepOrder: step.order,
        data: stepResult,
      })

      try {
        const result = await this.executeStep(step)
        stepResult.status = "completed"
        stepResult.output = result.content
        stepResult.mappedOutput = this.applyOutputMapping(result.content, step.output_mapping)
        stepResult.tokens = result.tokens
        stepResult.latency_ms = result.latency_ms

        // Store result in context for subsequent steps
        this.context[`step_${step.order}_output`] = stepResult.mappedOutput || result.content

        this.results.push(stepResult)

        onProgress?.({
          type: "step_complete",
          stepOrder: step.order,
          data: stepResult,
        })
      } catch (_error) {
        // Retry once on failure
        try {
          const retryResult = await this.executeStep(step)
          stepResult.status = "completed"
          stepResult.output = retryResult.content
          stepResult.mappedOutput = this.applyOutputMapping(retryResult.content, step.output_mapping)
          stepResult.tokens = retryResult.tokens
          stepResult.latency_ms = retryResult.latency_ms

          this.context[`step_${step.order}_output`] = stepResult.mappedOutput || retryResult.content
          this.results.push(stepResult)

          onProgress?.({
            type: "step_complete",
            stepOrder: step.order,
            data: stepResult,
          })
        } catch (retryError) {
          stepResult.status = "failed"
          stepResult.error = retryError instanceof Error ? retryError.message : String(retryError)
          this.results.push(stepResult)

          onProgress?.({
            type: "step_error",
            stepOrder: step.order,
            data: stepResult,
          })
        }
      }
    }

    onProgress?.({
      type: "run_complete",
      stepOrder: -1,
      data: this.results,
    })

    return this.results
  }

  private async executeStep(step: PipelineStep) {
    // Build messages
    const messages: UnifiedMessage[] = []

    if (step.system_prompt) {
      messages.push({
        role: "system",
        content: this.resolveVariables(step.system_prompt),
      })
    }

    messages.push({
      role: "user",
      content: this.resolveVariables(step.user_prompt),
    })

    // Get API key
    let apiKey = ""
    let baseUrl: string | undefined

    if (step.api_key_id) {
      const apiKeyRecord = await prisma.apiKey.findUnique({
        where: { id: step.api_key_id },
      })

      if (!apiKeyRecord) {
        throw new Error(`API key not found for step "${step.name}"`)
      }

      apiKey = decrypt(apiKeyRecord.encrypted_key)
      baseUrl = apiKeyRecord.base_url || undefined
    } else {
      throw new Error(`No API key configured for step "${step.name}"`)
    }

    // Call LLM
    const response = await callLLM({
      provider: step.provider,
      model: step.model,
      messages,
      config: step.config || {},
      apiKey,
      baseUrl,
    })

    return response
  }

  resolveVariables(template: string): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (this.context[key] !== undefined) {
        return this.context[key]
      }
      return match // Leave unresolved variables as-is
    })
  }

  private applyOutputMapping(content: string, mapping: any): string {
    if (!mapping || typeof mapping !== "object") return content

    const mappingType = mapping.type || "full_response"

    switch (mappingType) {
      case "full_response":
        return content

      case "json_path": {
        try {
          const json = JSON.parse(content)
          const path = mapping.path || ""
          return this.getByDotPath(json, path)
        } catch {
          return content
        }
      }

      case "regex_extract": {
        try {
          const pattern = mapping.pattern || ""
          const regex = new RegExp(pattern)
          const match = content.match(regex)
          return match?.[1] || match?.[0] || content
        } catch {
          return content
        }
      }

      default:
        return content
    }
  }

  private getByDotPath(obj: any, path: string): string {
    const parts = path.split(".")
    let current = obj

    for (const part of parts) {
      if (current === null || current === undefined) return ""
      current = current[part]
    }

    return typeof current === "string" ? current : JSON.stringify(current)
  }
}
