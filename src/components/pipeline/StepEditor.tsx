"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PromptEditor } from "@/components/pipeline/PromptEditor"
import { PROVIDERS, type ProviderKey } from "@/lib/providers"
import type { StepData } from "@/components/pipeline/StepCard"

interface StepConfig {
  temperature?: number
  max_tokens?: number
  top_p?: number
  response_format?: { type: "text" | "json_object" }
}

interface MappingConfig {
  mode?: "full_response" | "json_path" | "regex_extract"
  pattern?: string
}

interface StepEditorProps {
  step: StepData | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (step: StepData) => void
  totalSteps: number
}

export function StepEditor({
  step,
  open,
  onOpenChange,
  onSave,
  totalSteps,
}: StepEditorProps) {
  const [name, setName] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [userPrompt, setUserPrompt] = useState("")
  const [provider, setProvider] = useState<ProviderKey>("openai")
  const [model, setModel] = useState("")
  const [customModel, setCustomModel] = useState("")
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1024)
  const [topP, setTopP] = useState(1)
  const [responseFormat, setResponseFormat] = useState<"text" | "json_object">("text")
  const [inputMappingMode, setInputMappingMode] = useState<string>("full_response")
  const [inputMappingPattern, setInputMappingPattern] = useState("")
  const [outputMappingMode, setOutputMappingMode] = useState<string>("full_response")
  const [outputMappingPattern, setOutputMappingPattern] = useState("")

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const initializedRef = useRef(false)

  // Populate state when step changes
  useEffect(() => {
    if (step) {
      initializedRef.current = false
      setName(step.name)
      setSystemPrompt(step.system_prompt || "")
      setUserPrompt(step.user_prompt)
      setProvider(step.provider as ProviderKey)
      setModel(step.model)
      setCustomModel("")

      const config = (step.config || {}) as StepConfig
      setTemperature(config.temperature ?? 0.7)
      setMaxTokens(config.max_tokens ?? 1024)
      setTopP(config.top_p ?? 1)
      setResponseFormat(config.response_format?.type ?? "text")

      const inputMap = (step.input_mapping || {}) as MappingConfig
      setInputMappingMode(inputMap.mode || "full_response")
      setInputMappingPattern(inputMap.pattern || "")

      const outputMap = (step.output_mapping || {}) as MappingConfig
      setOutputMappingMode(outputMap.mode || "full_response")
      setOutputMappingPattern(outputMap.pattern || "")

      // Allow auto-save after initialization is complete
      requestAnimationFrame(() => {
        initializedRef.current = true
      })
    }
  }, [step])

  // Build the updated step data
  const buildStepData = useCallback((): StepData | null => {
    if (!step) return null
    return {
      ...step,
      name,
      system_prompt: systemPrompt || null,
      user_prompt: userPrompt,
      provider,
      model: customModel || model,
      config: {
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        response_format: { type: responseFormat },
      },
      input_mapping: {
        mode: inputMappingMode,
        pattern: inputMappingPattern,
      },
      output_mapping: {
        mode: outputMappingMode,
        pattern: outputMappingPattern,
      },
    }
  }, [
    step, name, systemPrompt, userPrompt, provider, model, customModel,
    temperature, maxTokens, topP, responseFormat,
    inputMappingMode, inputMappingPattern, outputMappingMode, outputMappingPattern,
  ])

  // Auto-save with debounce
  useEffect(() => {
    if (!initializedRef.current || !step) return

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      const updated = buildStepData()
      if (updated) {
        onSave(updated)
      }
    }, 500)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [
    name, systemPrompt, userPrompt, provider, model, customModel,
    temperature, maxTokens, topP, responseFormat,
    inputMappingMode, inputMappingPattern, outputMappingMode, outputMappingPattern,
    buildStepData, onSave, step,
  ])

  // Available variables based on step order
  const availableVariables = step
    ? [
        "{{input}}",
        ...Array.from({ length: step.order }, (_, i) => `{{step_${i + 1}_output}}`),
      ]
    : []

  const providerModels = PROVIDERS[provider]?.models || []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0"
              placeholder="Step name"
            />
          </SheetTitle>
          <SheetDescription>
            Configure the LLM step prompt, model, and parameters.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="prompt" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="prompt" className="flex-1">Prompt</TabsTrigger>
            <TabsTrigger value="model" className="flex-1">Model</TabsTrigger>
            <TabsTrigger value="parameters" className="flex-1">Parameters</TabsTrigger>
            <TabsTrigger value="mapping" className="flex-1">Mapping</TabsTrigger>
          </TabsList>

          {/* Prompt Tab */}
          <TabsContent value="prompt" className="space-y-6 mt-4">
            <PromptEditor
              label="System Prompt"
              value={systemPrompt}
              onChange={setSystemPrompt}
              placeholder="You are a helpful assistant..."
              availableVariables={[]}
            />
            <PromptEditor
              label="User Prompt"
              value={userPrompt}
              onChange={setUserPrompt}
              placeholder="Enter the user prompt with {{variables}}..."
              required
              availableVariables={availableVariables}
            />
          </TabsContent>

          {/* Model Tab */}
          <TabsContent value="model" className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={provider}
                onValueChange={(val) => {
                  const newProvider = val as ProviderKey
                  setProvider(newProvider)
                  const models = PROVIDERS[newProvider]?.models || []
                  setModel(models[0] || "")
                  setCustomModel("")
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROVIDERS).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${info.color}`} />
                        {info.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Model</Label>
              {providerModels.length > 0 ? (
                <Select value={model} onValueChange={(val) => { setModel(val); setCustomModel(""); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {providerModels.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              <Input
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="Or enter a custom model name"
                className="mt-2"
              />
              {customModel && (
                <p className="text-xs text-muted-foreground">
                  Using custom model: <Badge variant="outline">{customModel}</Badge>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>API Key</Label>
              <Select disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Configure in Settings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder">No keys configured</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                API keys can be managed in the Settings page.
              </p>
            </div>
          </TabsContent>

          {/* Parameters Tab */}
          <TabsContent value="parameters" className="space-y-6 mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Temperature</Label>
                <Badge variant="outline">{temperature.toFixed(1)}</Badge>
              </div>
              <Slider
                value={[temperature]}
                onValueChange={([val]) => setTemperature(val)}
                min={0}
                max={2}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-tokens">Max Tokens</Label>
              <Input
                id="max-tokens"
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 0)}
                min={1}
                max={128000}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Top P</Label>
                <Badge variant="outline">{topP.toFixed(2)}</Badge>
              </div>
              <Slider
                value={[topP]}
                onValueChange={([val]) => setTopP(val)}
                min={0}
                max={1}
                step={0.01}
              />
            </div>

            <div className="space-y-2">
              <Label>Response Format</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="response-format"
                    value="text"
                    checked={responseFormat === "text"}
                    onChange={() => setResponseFormat("text")}
                    className="accent-primary"
                  />
                  <span className="text-sm">Text</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="response-format"
                    value="json_object"
                    checked={responseFormat === "json_object"}
                    onChange={() => setResponseFormat("json_object")}
                    className="accent-primary"
                  />
                  <span className="text-sm">JSON Object</span>
                </label>
              </div>
            </div>
          </TabsContent>

          {/* Mapping Tab */}
          <TabsContent value="mapping" className="space-y-6 mt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Input Mapping</h3>
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select value={inputMappingMode} onValueChange={setInputMappingMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_response">Full Response</SelectItem>
                    <SelectItem value="json_path">JSON Path</SelectItem>
                    <SelectItem value="regex_extract">Regex Extract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {inputMappingMode !== "full_response" && (
                <div className="space-y-2">
                  <Label>Pattern</Label>
                  <Input
                    value={inputMappingPattern}
                    onChange={(e) => setInputMappingPattern(e.target.value)}
                    placeholder={
                      inputMappingMode === "json_path"
                        ? "$.result.text"
                        : "(?<=answer: ).*"
                    }
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Output Mapping</h3>
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select value={outputMappingMode} onValueChange={setOutputMappingMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_response">Full Response</SelectItem>
                    <SelectItem value="json_path">JSON Path</SelectItem>
                    <SelectItem value="regex_extract">Regex Extract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {outputMappingMode !== "full_response" && (
                <div className="space-y-2">
                  <Label>Pattern</Label>
                  <Input
                    value={outputMappingPattern}
                    onChange={(e) => setOutputMappingPattern(e.target.value)}
                    placeholder={
                      outputMappingMode === "json_path"
                        ? "$.result.text"
                        : "(?<=answer: ).*"
                    }
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
