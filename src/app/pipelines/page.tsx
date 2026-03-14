"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Copy, Trash2, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface Pipeline {
  id: string
  name: string
  description: string | null
  is_public: boolean
  is_template: boolean
  tags: string[]
  created_at: string
  updated_at: string
  _count: {
    steps: number
    runs: number
  }
}

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [creating, setCreating] = useState(false)

  const fetchPipelines = async () => {
    try {
      const res = await fetch("/api/pipelines")
      if (res.ok) {
        const data = await res.json()
        setPipelines(data)
      }
    } catch (err) {
      console.error("Failed to fetch pipelines:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPipelines()
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || null,
        }),
      })
      if (res.ok) {
        setNewName("")
        setNewDescription("")
        setDialogOpen(false)
        await fetchPipelines()
      }
    } catch (err) {
      console.error("Failed to create pipeline:", err)
    } finally {
      setCreating(false)
    }
  }

  const handleDuplicate = async (pipeline: Pipeline) => {
    try {
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${pipeline.name} (copy)`,
          description: pipeline.description,
          tags: pipeline.tags,
        }),
      })
      if (res.ok) {
        await fetchPipelines()
      }
    } catch (err) {
      console.error("Failed to duplicate pipeline:", err)
    }
  }

  const handleDelete = async (pipelineId: string) => {
    if (!confirm("Are you sure you want to delete this pipeline?")) return
    try {
      const res = await fetch(`/api/pipelines/${pipelineId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setPipelines((prev) => prev.filter((p) => p.id !== pipelineId))
      }
    } catch (err) {
      console.error("Failed to delete pipeline:", err)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-5 w-20" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Pipelines</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Pipeline
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Pipeline</DialogTitle>
              <DialogDescription>
                Give your pipeline a name and optional description.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="pipeline-name">Name</Label>
                <Input
                  id="pipeline-name"
                  placeholder="My pipeline"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pipeline-desc">Description</Label>
                <Textarea
                  id="pipeline-desc"
                  placeholder="What does this pipeline do?"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
                {creating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {pipelines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Layers className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No pipelines yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Create your first AI pipeline to chain LLM calls together. Each step
            can use a different model and provider.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Pipeline
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pipelines.map((pipeline) => (
            <Card key={pipeline.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                  <Badge variant="secondary">
                    {pipeline._count.steps}{" "}
                    {pipeline._count.steps === 1 ? "step" : "steps"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {pipeline.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-xs text-muted-foreground">
                  Created{" "}
                  {new Date(pipeline.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </CardContent>
              <CardFooter className="gap-2">
                <Button asChild variant="default" size="sm" className="flex-1">
                  <Link href={`/pipelines/${pipeline.id}`}>Open</Link>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => handleDuplicate(pipeline)}
                  title="Duplicate"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(pipeline.id)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
