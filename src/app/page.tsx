"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GitBranch, Play, Key, Plus, ArrowRight } from "lucide-react"

interface DashboardStats {
  pipelines: number
  runs: number
  apiKeys: number
  recentRuns: Array<{
    id: string
    pipeline_name: string
    status: string
    created_at: string
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    fetch("/api/pipelines")
      .then((r) => r.json())
      .then((pipelines) => {
        fetch("/api/providers")
          .then((r) => r.json())
          .then((keys) => {
            setStats({
              pipelines: pipelines.length || 0,
              runs: 0,
              apiKeys: keys.length || 0,
              recentRuns: [],
            })
          })
      })
      .catch(() => {
        setStats({ pipelines: 0, runs: 0, apiKeys: 0, recentRuns: [] })
      })
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Build and run AI pipelines with any LLM provider
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipelines</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pipelines ?? "-"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.runs ?? "-"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.apiKeys ?? "-"}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/settings">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Key className="h-4 w-4" /> Add API Key
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pipelines">
              <Button variant="outline" className="w-full justify-between mt-2">
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Create Pipeline
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/templates">
              <Button variant="outline" className="w-full justify-between mt-2">
                <span className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" /> Browse Templates
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Runs</CardTitle>
          </CardHeader>
          <CardContent>
            {!stats?.recentRuns?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No runs yet. Create a pipeline and run it!
              </p>
            ) : (
              <div className="space-y-2">
                {stats.recentRuns.map((run) => (
                  <div key={run.id} className="flex items-center justify-between py-2">
                    <span className="text-sm">{run.pipeline_name}</span>
                    <Badge variant={run.status === "completed" ? "success" : "destructive"}>
                      {run.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
