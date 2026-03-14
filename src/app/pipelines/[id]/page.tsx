"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { ArrowLeft, Play, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { KanbanBoard } from "@/components/pipeline/KanbanBoard"
import type { StepData } from "@/components/pipeline/StepCard"

interface Pipeline {
  id: string
  name: string
  description: string | null
  tags: string[]
  created_at: string
  updated_at: string
  steps: StepData[]
}

export default function PipelineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [pipeline, setPipeline] = useState<Pipeline | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState("")

  useEffect(() => {
    const fetchPipeline = async () => {
      try {
        const res = await fetch(`/api/pipelines/${id}`)
        if (res.ok) {
          const data = await res.json()
          setPipeline(data)
          setNameValue(data.name)
        }
      } catch (error) {
        console.error("Failed to fetch pipeline:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchPipeline()
  }, [id])

  const handleNameSave = async () => {
    if (!nameValue.trim() || !pipeline) return
    setEditingName(false)
    try {
      await fetch(`/api/pipelines/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameValue }),
      })
      setPipeline((prev) => (prev ? { ...prev, name: nameValue } : prev))
    } catch (error) {
      console.error("Failed to update pipeline name:", error)
    }
  }

  const handleStepsChange = (steps: StepData[]) => {
    setPipeline((prev) => (prev ? { ...prev, steps } : prev))
  }

  const handleRunPipeline = async () => {
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipeline_id: id }),
      })
      if (res.ok) {
        const run = await res.json()
        // Trigger execution
        await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ run_id: run.id }),
        })
      }
    } catch (error) {
      console.error("Failed to run pipeline:", error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-6 w-24 mb-6" />
        <Skeleton className="h-10 w-72 mb-8" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!pipeline) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Pipeline not found.</p>
        <Button asChild variant="link" className="mt-4 p-0">
          <Link href="/pipelines">Back to Pipelines</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/pipelines">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {editingName ? (
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNameSave()
                if (e.key === "Escape") {
                  setEditingName(false)
                  setNameValue(pipeline.name)
                }
              }}
              className="text-3xl font-bold h-auto py-1"
              autoFocus
            />
          ) : (
            <h1
              className="text-3xl font-bold cursor-pointer hover:text-muted-foreground transition-colors"
              onClick={() => setEditingName(true)}
              title="Click to edit"
            >
              {pipeline.name}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/pipelines/${id}/runs`}>
              <History className="mr-2 h-4 w-4" />
              Runs
            </Link>
          </Button>
          <Button onClick={handleRunPipeline} size="sm">
            <Play className="mr-2 h-4 w-4" />
            Run Pipeline
          </Button>
        </div>
      </div>

      {pipeline.description && (
        <p className="text-muted-foreground mb-6">{pipeline.description}</p>
      )}

      <KanbanBoard
        steps={pipeline.steps}
        pipelineId={pipeline.id}
        onStepsChange={handleStepsChange}
      />
    </div>
  )
}
