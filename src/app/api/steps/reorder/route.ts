import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { pipeline_id, step_ids } = body as {
      pipeline_id: string
      step_ids: string[]
    }

    if (!pipeline_id || !step_ids || !Array.isArray(step_ids)) {
      return NextResponse.json(
        { error: "pipeline_id and step_ids array are required" },
        { status: 400 }
      )
    }

    const pipeline = await prisma.pipeline.findUnique({
      where: { id: pipeline_id },
    })

    if (!pipeline || pipeline.user_id !== user.id) {
      return NextResponse.json({ error: "Pipeline not found" }, { status: 404 })
    }

    // Update order for each step based on array index
    await prisma.$transaction(
      step_ids.map((stepId, index) =>
        prisma.step.update({
          where: { id: stepId },
          data: { order: index },
        })
      )
    )

    const steps = await prisma.step.findMany({
      where: { pipeline_id },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(steps)
  } catch (error) {
    console.error("Failed to reorder steps:", error)
    return NextResponse.json(
      { error: "Failed to reorder steps" },
      { status: 500 }
    )
  }
}
