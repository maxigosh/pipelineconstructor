"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"

interface StepProgress {
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

interface RunMonitorProps {
  pipelineId: string
  input: Record<string, string>
  totalSteps: number
  open: boolean
  onClose: () => void
}

export function RunMonitor({ pipelineId, input, totalSteps, open, onClose }: RunMonitorProps) {
  const [steps, setSteps] = useState<StepProgress[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentOutput, setCurrentOutput] = useState("")
  const eventSourceRef = useRef<EventSource | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    // Reset state
    setSteps([])
    setIsRunning(true)
    setIsComplete(false)
    setElapsedTime(0)
    setCurrentOutput("")
    startTimeRef.current = Date.now()

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 100)

    // Start execution via fetch (EventSource doesn't support POST)
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const startExecution = async () => {
      try {
        const response = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pipelineId, input }),
          signal: abortController.signal,
        })

        if (!response.ok || !response.body) {
          setIsRunning(false)
          setIsComplete(true)
          return
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
              handleEvent(event)
            } catch {
              // Skip malformed events
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("SSE connection error:", error)
        }
      } finally {
        setIsRunning(false)
        setIsComplete(true)
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }

    startExecution()

    return () => {
      abortController.abort()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [open, pipelineId, input])

  const handleEvent = (event: { type: string; stepOrder: number; data: any }) => {
    switch (event.type) {
      case "step_start":
        setSteps((prev) => {
          const existing = prev.find((s) => s.stepOrder === event.data.stepOrder)
          if (existing) {
            return prev.map((s) =>
              s.stepOrder === event.data.stepOrder ? { ...s, status: "running" } : s
            )
          }
          return [...prev, { ...event.data, status: "running" }]
        })
        setCurrentOutput("")
        break

      case "step_complete":
        setSteps((prev) =>
          prev.map((s) =>
            s.stepOrder === event.data.stepOrder
              ? { ...event.data, status: "completed" }
              : s
          )
        )
        setCurrentOutput(event.data.mappedOutput || event.data.output || "")
        break

      case "step_error":
        setSteps((prev) =>
          prev.map((s) =>
            s.stepOrder === event.data.stepOrder
              ? { ...event.data, status: "failed" }
              : s
          )
        )
        break

      case "run_complete":
        setIsRunning(false)
        setIsComplete(true)
        if (timerRef.current) clearInterval(timerRef.current)
        break
    }
  }

  const handleCancel = () => {
    abortControllerRef.current?.abort()
    setIsRunning(false)
    setIsComplete(true)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const completedSteps = steps.filter((s) => s.status === "completed").length
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
  const totalTokens = steps.reduce((sum, s) => sum + (s.tokens?.total || 0), 0)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="text-muted-foreground">&#9675;</span>
      case "running":
        return <span className="text-blue-500 animate-pulse">&#9654;</span>
      case "completed":
        return <span className="text-green-500">&#10003;</span>
      case "failed":
        return <span className="text-red-500">&#10007;</span>
      default:
        return <span className="text-muted-foreground">&#9675;</span>
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Pipeline Execution</span>
            <span className="text-sm font-mono text-muted-foreground">
              {formatTime(elapsedTime)}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                {completedSteps} / {totalSteps} steps
              </span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Steps List */}
          <div className="space-y-2">
            {steps.map((step) => (
              <div
                key={step.stepOrder}
                className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/50"
              >
                <div className="text-lg">{getStatusIcon(step.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{step.stepName}</div>
                  {step.error && (
                    <div className="text-xs text-red-500 truncate">{step.error}</div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {step.tokens && <span>{step.tokens.total} tokens</span>}
                  {step.latency_ms !== undefined && step.status === "completed" && (
                    <span className="ml-2">{(step.latency_ms / 1000).toFixed(1)}s</span>
                  )}
                </div>
              </div>
            ))}

            {/* Show pending steps */}
            {Array.from({ length: Math.max(0, totalSteps - steps.length) }).map((_, i) => (
              <div
                key={`pending-${i}`}
                className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/30"
              >
                <div className="text-lg">{getStatusIcon("pending")}</div>
                <div className="text-sm text-muted-foreground">
                  Step {steps.length + i + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Current Output */}
          {currentOutput && (
            <div className="flex-1 min-h-0">
              <div className="text-sm font-medium mb-1">Latest Output</div>
              <ScrollArea className="h-32 rounded-md border p-3">
                <div ref={outputRef} className="text-sm font-mono whitespace-pre-wrap">
                  {currentOutput}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-4 text-xs text-muted-foreground border-t pt-2">
            <span>Total tokens: {totalTokens}</span>
            <span>Elapsed: {formatTime(elapsedTime)}</span>
            <span>
              Status:{" "}
              {isRunning
                ? "Running"
                : isComplete
                  ? steps.some((s) => s.status === "failed")
                    ? "Failed"
                    : "Completed"
                  : "Idle"}
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {isRunning ? (
              <Button variant="destructive" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
