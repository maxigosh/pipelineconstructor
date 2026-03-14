"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { ArrowLeft, Download, ChevronDown, ChevronRight, Clock, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface StepResult {
  id: string
  step_id: string
  step_order: number
  status: "pending" | "running" | "completed" | "failed"
  input: Record<string, unknown>
  output: Record<string, unknown>
  tokens_used: number
  latency_ms: number
  error: string | null
  created_at: string
}

interface Run {
  id: string
  pipeline_id: string
  status: "pending" | "running" | "completed" | "failed" | "cancelled"
  input: Record<string, unknown>
  current_step: number
  started_at: string | null
  completed_at: string | null
  total_tokens: number
  total_cost_cents: number
  created_at: string
  step_results: StepResult[]
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "success" | "warning" | "outline"> = {
  pending: "secondary",
  running: "warning",
  completed: "success",
  failed: "destructive",
  cancelled: "outline",
}

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return "-"
  const start = new Date(startedAt).getTime()
  const end = completedAt ? new Date(completedAt).getTime() : Date.now()
  const ms = end - start
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

export default function RunsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRun, setExpandedRun] = useState<string | null>(null)

  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const res = await fetch(`/api/runs?pipeline_id=${id}`)
        if (res.ok) {
          const data = await res.json()
          setRuns(data)
        }
      } catch (error) {
        console.error("Failed to fetch runs:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchRuns()
  }, [id])

  const toggleExpand = (runId: string) => {
    setExpandedRun((prev) => (prev === runId ? null : runId))
  }

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(runs, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pipeline-${id}-runs.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-6 w-24 mb-6" />
        <Skeleton className="h-9 w-48 mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/pipelines/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pipeline
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Run History</h1>
        {runs.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExportJson}>
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        )}
      </div>

      {runs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Clock className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No runs yet</h2>
          <p className="text-muted-foreground max-w-md">
            This pipeline has not been executed yet. Go back to the pipeline
            and click &quot;Run Pipeline&quot; to start.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[auto_1fr_120px_120px_100px_100px] gap-4 px-4 py-3 bg-muted/50 text-sm font-medium text-muted-foreground">
            <div className="w-6" />
            <div>Date</div>
            <div>Status</div>
            <div>Steps</div>
            <div>Tokens</div>
            <div>Duration</div>
          </div>

          {/* Rows */}
          {runs.map((run) => (
            <div key={run.id}>
              <div
                className={cn(
                  "grid grid-cols-[auto_1fr_120px_120px_100px_100px] gap-4 px-4 py-3 text-sm cursor-pointer hover:bg-muted/30 transition-colors border-t",
                  expandedRun === run.id && "bg-muted/20"
                )}
                onClick={() => toggleExpand(run.id)}
              >
                <div className="flex items-center w-6">
                  {expandedRun === run.id ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
                <div className="flex items-center">
                  {new Date(run.created_at).toLocaleString()}
                </div>
                <div className="flex items-center">
                  <Badge variant={statusVariant[run.status] || "secondary"}>
                    {run.status}
                  </Badge>
                </div>
                <div className="flex items-center">
                  {run.step_results.filter((sr) => sr.status === "completed").length}/
                  {run.step_results.length}
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {run.total_tokens.toLocaleString()}
                </div>
                <div className="flex items-center">
                  {formatDuration(run.started_at, run.completed_at)}
                </div>
              </div>

              {/* Expanded step details */}
              {expandedRun === run.id && (
                <div className="px-4 pb-4 bg-muted/10 border-t">
                  <div className="mt-3 space-y-2">
                    {run.step_results.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">
                        No step results available.
                      </p>
                    ) : (
                      run.step_results.map((sr) => (
                        <div
                          key={sr.id}
                          className="rounded-md border bg-background p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              Step {sr.step_order + 1}
                            </span>
                            <div className="flex items-center gap-3">
                              <Badge
                                variant={statusVariant[sr.status] || "secondary"}
                                className="text-xs"
                              >
                                {sr.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {sr.tokens_used} tokens
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {sr.latency_ms}ms
                              </span>
                            </div>
                          </div>
                          {sr.error && (
                            <p className="text-xs text-destructive mt-1">
                              Error: {sr.error}
                            </p>
                          )}
                          {sr.output && Object.keys(sr.output).length > 0 && (
                            <>
                              <Separator className="my-2" />
                              <pre className="text-xs text-muted-foreground overflow-x-auto max-h-32 whitespace-pre-wrap">
                                {typeof sr.output === "string"
                                  ? sr.output
                                  : JSON.stringify(sr.output, null, 2)}
                              </pre>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
