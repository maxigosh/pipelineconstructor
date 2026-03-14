import { useState, useCallback } from "react"

interface Pipeline {
  id: string
  name: string
  description: string | null
  is_public: boolean
  is_template: boolean
  tags: string[]
  created_at: string
  updated_at: string
  steps?: any[]
}

interface CreatePipelineData {
  name: string
  description?: string
  is_public?: boolean
  tags?: string[]
}

interface UpdatePipelineData {
  name?: string
  description?: string
  is_public?: boolean
  is_template?: boolean
  tags?: string[]
}

export function usePipeline() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPipelines = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/pipelines")
      if (!res.ok) throw new Error("Failed to fetch pipelines")
      const data = await res.json()
      setPipelines(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createPipeline = useCallback(async (data: CreatePipelineData) => {
    setError(null)
    try {
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create pipeline")
      const pipeline = await res.json()
      setPipelines((prev) => [pipeline, ...prev])
      return pipeline
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(message)
      return null
    }
  }, [])

  const updatePipeline = useCallback(async (id: string, data: UpdatePipelineData) => {
    setError(null)
    try {
      const res = await fetch(`/api/pipelines/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update pipeline")
      const updated = await res.json()
      setPipelines((prev) => prev.map((p) => (p.id === id ? updated : p)))
      return updated
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(message)
      return null
    }
  }, [])

  const deletePipeline = useCallback(async (id: string) => {
    setError(null)
    try {
      const res = await fetch(`/api/pipelines/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete pipeline")
      setPipelines((prev) => prev.filter((p) => p.id !== id))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(message)
      return false
    }
  }, [])

  const duplicatePipeline = useCallback(async (id: string) => {
    setError(null)
    try {
      const res = await fetch(`/api/pipelines/${id}/duplicate`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to duplicate pipeline")
      const duplicated = await res.json()
      setPipelines((prev) => [duplicated, ...prev])
      return duplicated
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(message)
      return null
    }
  }, [])

  return {
    pipelines,
    loading,
    error,
    fetchPipelines,
    createPipeline,
    updatePipeline,
    deletePipeline,
    duplicatePipeline,
  }
}
