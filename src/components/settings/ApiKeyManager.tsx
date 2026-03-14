"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast"
import { PROVIDERS, type ProviderKey } from "@/lib/providers"
import { Plus, Trash2, TestTube, Loader2, Key, CheckCircle, XCircle } from "lucide-react"

interface ApiKeyData {
  id: string
  provider: ProviderKey
  label: string
  masked_key: string
  base_url: string | null
  is_active: boolean
  last_used_at: string | null
}

export function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKeyData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({})
  const { toast } = useToast()

  // Form state
  const [provider, setProvider] = useState<ProviderKey>("openai")
  const [label, setLabel] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [baseUrl, setBaseUrl] = useState("")

  useEffect(() => {
    fetchKeys()
  }, [])

  async function fetchKeys() {
    try {
      const res = await fetch("/api/providers")
      const data = await res.json()
      setKeys(data)
    } catch {
      toast({ title: "Failed to load API keys", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!label || !apiKey) {
      toast({ title: "Please fill all required fields", variant: "destructive" })
      return
    }
    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          label,
          api_key: apiKey,
          base_url: provider === "custom" ? baseUrl : undefined,
        }),
      })
      if (!res.ok) throw new Error()
      toast({ title: "API key added", variant: "success" })
      setDialogOpen(false)
      setLabel("")
      setApiKey("")
      setBaseUrl("")
      fetchKeys()
    } catch {
      toast({ title: "Failed to add API key", variant: "destructive" })
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/providers?id=${id}`, { method: "DELETE" })
      toast({ title: "API key deleted" })
      fetchKeys()
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" })
    }
  }

  async function handleTest(id: string) {
    setTesting(id)
    setTestResults((prev) => ({ ...prev, [id]: null }))
    try {
      const res = await fetch(`/api/providers/test?id=${id}`, { method: "POST" })
      const data = await res.json()
      setTestResults((prev) => ({ ...prev, [id]: data.success }))
      toast({
        title: data.success ? "Connection successful" : "Connection failed",
        description: data.error || undefined,
        variant: data.success ? "success" : "destructive",
      })
    } catch {
      setTestResults((prev) => ({ ...prev, [id]: false }))
      toast({ title: "Test failed", variant: "destructive" })
    } finally {
      setTesting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">API Keys</h2>
          <p className="text-muted-foreground">Manage your LLM provider API keys</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Key
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : keys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No API keys yet</p>
            <p className="text-sm text-muted-foreground mb-4">Add your first API key to start building pipelines</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add API Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {keys.map((key) => (
            <Card key={key.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${PROVIDERS[key.provider]?.color || "bg-gray-500"}`} />
                  <div>
                    <p className="font-medium">{key.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{PROVIDERS[key.provider]?.name || key.provider}</Badge>
                      <code className="text-xs text-muted-foreground">{key.masked_key}</code>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {testResults[key.id] === true && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {testResults[key.id] === false && <XCircle className="h-4 w-4 text-red-500" />}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(key.id)}
                    disabled={testing === key.id}
                  >
                    {testing === key.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <TestTube className="h-3 w-3" />
                    )}
                    <span className="ml-1">Test</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(key.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add API Key</DialogTitle>
            <DialogDescription>Add a new LLM provider API key for use in pipelines</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={provider} onValueChange={(v) => setProvider(v as ProviderKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROVIDERS).map(([key, info]) => (
                    <SelectItem key={key} value={key}>{info.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                placeholder="e.g. My OpenAI Key"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            {provider === "custom" && (
              <div className="space-y-2">
                <Label>Base URL</Label>
                <Input
                  placeholder="https://your-api.com/v1"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
