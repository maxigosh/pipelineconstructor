"use client"

import { useState } from "react"
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { StepCard, type StepData } from "@/components/pipeline/StepCard"
import { StepEditor } from "@/components/pipeline/StepEditor"

interface KanbanBoardProps {
  steps: StepData[]
  pipelineId: string
  onStepsChange: (steps: StepData[]) => void
}

function SortableStepCard({
  step,
  onClick,
}: {
  step: StepData
  onClick: (step: StepData) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <StepCard step={step} onClick={onClick} />
    </div>
  )
}

function ArrowConnector() {
  return (
    <div className="flex items-center shrink-0 px-1">
      <div className="w-6 h-px bg-border" />
      <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[6px] border-l-border" />
    </div>
  )
}

export function KanbanBoard({ steps, pipelineId, onStepsChange }: KanbanBoardProps) {
  const [editingStep, setEditingStep] = useState<StepData | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = steps.findIndex((s) => s.id === active.id)
    const newIndex = steps.findIndex((s) => s.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...steps]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    // Update order values
    const updated = reordered.map((s, i) => ({ ...s, order: i }))
    onStepsChange(updated)

    // Persist reorder to API
    fetch("/api/steps/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pipeline_id: pipelineId,
        step_ids: updated.map((s) => s.id),
      }),
    }).catch(console.error)
  }

  const handleStepClick = (step: StepData) => {
    setEditingStep(step)
    setEditorOpen(true)
  }

  const handleStepSave = async (updatedStep: StepData) => {
    // Update local state
    onStepsChange(
      steps.map((s) => (s.id === updatedStep.id ? updatedStep : s))
    )

    // Persist to API
    try {
      await fetch("/api/steps", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: updatedStep.id,
          name: updatedStep.name,
          user_prompt: updatedStep.user_prompt,
          system_prompt: updatedStep.system_prompt,
          provider: updatedStep.provider,
          model: updatedStep.model,
          config: updatedStep.config,
          input_mapping: updatedStep.input_mapping,
          output_mapping: updatedStep.output_mapping,
        }),
      })
    } catch (error) {
      console.error("Failed to save step:", error)
    }
  }

  const handleAddStep = async () => {
    try {
      const res = await fetch("/api/steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipeline_id: pipelineId,
          name: `Step ${steps.length + 1}`,
          provider: "openai",
          model: "gpt-4o-mini",
        }),
      })
      if (res.ok) {
        const newStep = await res.json()
        onStepsChange([...steps, newStep])
      }
    } catch (error) {
      console.error("Failed to add step:", error)
    }
  }

  return (
    <>
      <ScrollArea className="w-full">
        <div className="flex items-start gap-0 pb-4 px-2 min-h-[200px]">
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={steps.map((s) => s.id)}
              strategy={horizontalListSortingStrategy}
            >
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  {index > 0 && <ArrowConnector />}
                  <SortableStepCard step={step} onClick={handleStepClick} />
                </div>
              ))}
            </SortableContext>
          </DndContext>

          {steps.length > 0 && <ArrowConnector />}

          <Button
            variant="outline"
            className="shrink-0 w-64 h-[136px] border-dashed flex flex-col gap-2"
            onClick={handleAddStep}
          >
            <Plus className="h-5 w-5" />
            <span>Add Step</span>
          </Button>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <StepEditor
        step={editingStep}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={handleStepSave}
        totalSteps={steps.length}
      />
    </>
  )
}
