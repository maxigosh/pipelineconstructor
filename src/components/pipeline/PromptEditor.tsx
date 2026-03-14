"use client"

import { useRef, useCallback } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface PromptEditorProps {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  required?: boolean
  availableVariables: string[]
  className?: string
}

function highlightVariables(text: string): React.ReactNode[] {
  const parts = text.split(/(\\{\\{[^}]+\\}\\})/g)
  return parts.map((part, i) => {
    if (/^\\{\\{[^}]+\\}\\}$/.test(part)) {
      return (
        <span key={i} className="bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded px-0.5">
          {part}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export function PromptEditor({
  value,
  onChange,
  label,
  placeholder,
  required = false,
  availableVariables,
  className,
}: PromptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insertVariable = useCallback(
    (variable: string) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const before = value.slice(0, start)
      const after = value.slice(end)
      const newValue = before + variable + after
      onChange(newValue)

      // Restore cursor position after the inserted variable
      requestAnimationFrame(() => {
        textarea.focus()
        const newPos = start + variable.length
        textarea.setSelectionRange(newPos, newPos)
      })
    },
    [value, onChange]
  )

  return (
    <div className={cn("space-y-2", className)}>
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <div className="relative">
        {/* Highlight overlay */}
        <div
          className="absolute inset-0 p-3 text-sm leading-normal pointer-events-none overflow-hidden whitespace-pre-wrap break-words opacity-0"
          aria-hidden
        >
          {highlightVariables(value)}
        </div>

        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[120px] font-mono text-sm resize-y"
          required={required}
        />
      </div>

      {availableVariables.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Available variables (click to insert):</p>
          <div className="flex flex-wrap gap-1.5">
            {availableVariables.map((variable) => (
              <Badge
                key={variable}
                variant="outline"
                className="cursor-pointer hover:bg-accent transition-colors text-xs font-mono"
                onClick={() => insertVariable(variable)}
              >
                {variable}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
