import { useState, useCallback } from "react"

interface Step {
  id: string
  pipeline_id: string
  order: number
  name: string
  system_prompt: string | null
  user_prompt: string
  provider: string
  model: string
  api_key_id: string | null
  config: any
  input_mapping: any
  output_mapping: any
}

interface CreateStepData {
  name: string
  system_prompt?: string
  user_prompt: string
  provider: string
  model: string
  api_key_id?: string
  config?: any
  input_mapping?: any
  output_mapping?: any
}

interface UpdateStepData {
  name?: string
  system_prompt?: string | null
  user_prompt?: string
  provider?: string
  model?: string
  api_key_id?: string | null
  config?: any
  input_mapping?: any
  output_mapping?: any
}

export function useSteps(pipelineId: string) {
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSteps = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/pipelines/${pipelineId}/steps`)
      if (!res.ok) throw new Error("Failed to fetch steps")
      const data = await res.json()
      setSteps(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [pipelineId])

  const createStep = useCallback(
    async (data: CreateStepData) => {
      setError(null)
      try {
        const res = await fetch(`/api/pipelines/${pipelineId}/steps`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error("Failed to create step")
        const step = await res.json()
        setSteps((prev) => [...prev, step].sort((a, b) => a.order - b.order))
        return step
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        setError(message)
        return null
      }
    },
    [pipelineId]
  )

  const updateStep = useCallback(
    async (stepId: string, data: UpdateStepData) => {
      setError(null)
      try {
        const res = await fetch(`/api/pipelines/${pipelineId}/steps/${stepId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error("Failed to update step")
        const updated = await res.json()
        setSteps((prev) =>
          prev.map((s) => (s.id === stepId ? updated : s)).sort((a, b) => a.order - b.order)
        )
        return updated
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        setError(message)
        return null
      }
    },
    [pipelineId]
  )

  const deleteStep = useCallback(
    async (stepId: string) => {
      setError(null)
      try {
        const res = await fetch(`/api/pipelines/${pipelineId}/steps/${stepId}`, {
          method: "DELETE",
        })
        if (!res.ok) throw new Error("Failed to delete step")
        setSteps((prev) => prev.filter((s) => s.id !== stepId))
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        setError(message)
        return false
      }
    },
    [pipelineId]
  )

  const reorderSteps = useCallback(
    async (orderedStepIds: string[]) => {
      setError(null)
      try {
        const res = await fetch(`/api/pipelines/${pipelineId}/steps/reorder`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stepIds: orderedStepIds }),
        })
        if (!res.ok) throw new Error("Failed to reorder steps")
        const reordered = await res.json()
        setSteps(reordered)
        return reordered
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error"
        setError(message)
        // Refetch to restore correct order
        await fetchSteps()
        return null
      }
    },
    [pipelineId, fetchSteps]
  )

  return {
    steps,
    loading,
    error,
    fetchSteps,
    createStep,
    updateStep,
    deleteStep,
    reorderSteps,
  }
}
