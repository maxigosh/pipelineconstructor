import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getProviderInfo, type ProviderKey } from "@/lib/providers"
import { cn } from "@/lib/utils"

export interface StepData {
  id: string
  pipeline_id: string
  order: number
  name: string
  system_prompt: string | null
  user_prompt: string
  provider: string
  model: string
  api_key_id: string | null
  config: Record<string, unknown>
  input_mapping: Record<string, unknown>
  output_mapping: Record<string, unknown>
}

interface StepCardProps {
  step: StepData
  onClick: (step: StepData) => void
  className?: string
}

export function StepCard({ step, onClick, className }: StepCardProps) {
  const providerInfo = getProviderInfo(step.provider)
  const promptPreview =
    step.user_prompt.length > 80
      ? step.user_prompt.slice(0, 80) + "..."
      : step.user_prompt || "No prompt configured"

  return (
    <Card
      className={cn(
        "w-64 cursor-pointer transition-shadow hover:shadow-md shrink-0 select-none",
        className
      )}
      onClick={() => onClick(step)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-medium text-sm truncate">{step.name}</h4>
          <span className="text-xs text-muted-foreground shrink-0">
            #{step.order + 1}
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed min-h-[2.5rem]">
          {promptPreview}
        </p>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-block h-2.5 w-2.5 rounded-full shrink-0",
              providerInfo.color
            )}
            title={providerInfo.name}
          />
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {step.model}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
