import { useState, useCallback, useRef } from "react"

interface StepResult {
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

interface RunProgress {
  completedSteps: number
  totalSteps: number
  currentStep: number
  percent: number
}

export function useRunExecution() {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState<RunProgress>({
    completedSteps: 0,
    totalSteps: 0,
    currentStep: 0,
    percent: 0,
  })
  const [stepResults, setStepResults] = useState<StepResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const startRun = useCallback(
    async (pipelineId: string, input: Record<string, string>, totalSteps: number) => {
      // Reset state
      setIsRunning(true)
      setError(null)
      setStepResults([])
      setProgress({
        completedSteps: 0,
        totalSteps,
        currentStep: 0,
        percent: 0,
      })

      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        const response = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pipelineId, input }),
          signal: abortController.signal,
        })

        if (!response.ok || !response.body) {
          const errorText = await response.text()
          throw new Error(errorText || `HTTP ${response.status}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            try {
              const event = JSON.parse(line.slice(6))
              handleEvent(event, totalSteps)
            } catch {
              // Skip malformed events
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          const message = err instanceof Error ? err.message : "Unknown error"
          setError(message)
        }
      } finally {
        setIsRunning(false)
        abortControllerRef.current = null
      }
    },
    []
  )

  const handleEvent = (
    event: { type: string; stepOrder: number; data: any },
    totalSteps: number
  ) => {
    switch (event.type) {
      case "step_start":
        setStepResults((prev) => {
          const existing = prev.find((s) => s.stepOrder === event.data.stepOrder)
          if (existing) {
            return prev.map((s) =>
              s.stepOrder === event.data.stepOrder ? { ...s, status: "running" as const } : s
            )
          }
          return [...prev, { ...event.data, status: "running" as const }]
        })
        setProgress((prev) => ({
          ...prev,
          currentStep: event.data.stepOrder,
        }))
        break

      case "step_complete":
        setStepResults((prev) =>
          prev.map((s) =>
            s.stepOrder === event.data.stepOrder
              ? { ...event.data, status: "completed" as const }
              : s
          )
        )
        setProgress((prev) => {
          const completed = prev.completedSteps + 1
          return {
            ...prev,
            completedSteps: completed,
            percent: totalSteps > 0 ? (completed / totalSteps) * 100 : 0,
          }
        })
        break

      case "step_error":
        setStepResults((prev) =>
          prev.map((s) =>
            s.stepOrder === event.data.stepOrder
              ? { ...event.data, status: "failed" as const }
              : s
          )
        )
        setError(event.data.error || "Step failed")
        break

      case "run_complete":
        setIsRunning(false)
        setProgress((prev) => ({ ...prev, percent: 100 }))
        break
    }
  }

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsRunning(false)
  }, [])

  return {
    isRunning,
    progress,
    stepResults,
    error,
    startRun,
    cancel,
  }
}
