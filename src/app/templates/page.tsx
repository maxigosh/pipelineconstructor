"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutTemplate, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface Template {
  id: string
  name: string
  description: string | null
  tags: string[]
  created_at: string
  _count: {
    steps: number
    runs: number
  }
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [cloningId, setCloningId] = useState<string | null>(null)

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/pipelines?templates=true")
        if (res.ok) {
          const data = await res.json()
          setTemplates(data)
        }
      } catch (error) {
        console.error("Failed to fetch templates:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [])

  const handleUseTemplate = async (template: Template) => {
    setCloningId(template.id)
    try {
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${template.name} (from template)`,
          description: template.description,
          tags: template.tags,
          source_template_id: template.id,
        }),
      })
      if (res.ok) {
        const pipeline = await res.json()
        router.push(`/pipelines/${pipeline.id}`)
      }
    } catch (error) {
      console.error("Failed to clone template:", error)
    } finally {
      setCloningId(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-9 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-5 w-32" />
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Templates</h1>
        <p className="text-muted-foreground mt-2">
          Start with a pre-built pipeline template and customize it to your needs.
        </p>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <LayoutTemplate className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No templates available</h2>
          <p className="text-muted-foreground max-w-md">
            Templates will appear here once they are published. Check back later
            or create your own pipelines from scratch.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge variant="secondary">
                    {template._count.steps}{" "}
                    {template._count.steps === 1 ? "step" : "steps"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-3">
                  {template.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleUseTemplate(template)}
                  disabled={cloningId === template.id}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {cloningId === template.id ? "Cloning..." : "Use Template"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
