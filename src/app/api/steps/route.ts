import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    const pipelineId = request.nextUrl.searchParams.get("pipeline_id")
    if (!pipelineId) {
      return NextResponse.json(
        { error: "pipeline_id is required" },
        { status: 400 }
      )
    }

    const pipeline = await prisma.pipeline.findUnique({
      where: { id: pipelineId },
    })

    if (!pipeline || pipeline.user_id !== user.id) {
      return NextResponse.json({ error: "Pipeline not found" }, { status: 404 })
    }

    const steps = await prisma.step.findMany({
      where: { pipeline_id: pipelineId },
      orderBy: { order: "asc" },
    })

    return NextResponse.json(steps)
  } catch (error) {
    console.error("Failed to list steps:", error)
    return NextResponse.json(
      { error: "Failed to list steps", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    const body = await request.json()
    const {
      pipeline_id,
      name,
      user_prompt,
      system_prompt,
      provider,
      model,
      api_key_id,
      config,
      input_mapping,
      output_mapping,
    } = body

    if (!pipeline_id) {
      return NextResponse.json(
        { error: "pipeline_id is required" },
        { status: 400 }
      )
    }

    const pipeline = await prisma.pipeline.findUnique({
      where: { id: pipeline_id },
    })

    if (!pipeline || pipeline.user_id !== user.id) {
      return NextResponse.json({ error: "Pipeline not found" }, { status: 404 })
    }

    // Get max order to auto-set order
    const maxStep = await prisma.step.findFirst({
      where: { pipeline_id },
      orderBy: { order: "desc" },
      select: { order: true },
    })

    const nextOrder = maxStep ? maxStep.order + 1 : 0

    const step = await prisma.step.create({
      data: {
        pipeline_id,
        order: nextOrder,
        name: name || `Step ${nextOrder + 1}`,
        user_prompt: user_prompt || "",
        system_prompt: system_prompt || null,
        provider: provider || "openai",
        model: model || "gpt-4o-mini",
        api_key_id: api_key_id || null,
        config: config || {},
        input_mapping: input_mapping || {},
        output_mapping: output_mapping || {},
      },
    })

    return NextResponse.json(step, { status: 201 })
  } catch (error) {
    console.error("Failed to create step:", error)
    return NextResponse.json(
      { error: "Failed to create step", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    const body = await request.json()
    const { id, name, user_prompt, system_prompt, provider, model, api_key_id, config, input_mapping, output_mapping } = body

    if (!id) {
      return NextResponse.json(
        { error: "Step id is required" },
        { status: 400 }
      )
    }

    const step = await prisma.step.findUnique({
      where: { id },
      include: { pipeline: true },
    })

    if (!step || step.pipeline.user_id !== user.id) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 })
    }

    const updated = await prisma.step.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(user_prompt !== undefined && { user_prompt }),
        ...(system_prompt !== undefined && { system_prompt }),
        ...(provider !== undefined && { provider }),
        ...(model !== undefined && { model }),
        ...(api_key_id !== undefined && { api_key_id }),
        ...(config !== undefined && { config }),
        ...(input_mapping !== undefined && { input_mapping }),
        ...(output_mapping !== undefined && { output_mapping }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update step:", error)
    return NextResponse.json(
      { error: "Failed to update step", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    const stepId = request.nextUrl.searchParams.get("id")
    if (!stepId) {
      return NextResponse.json(
        { error: "Step id is required" },
        { status: 400 }
      )
    }

    const step = await prisma.step.findUnique({
      where: { id: stepId },
      include: { pipeline: true },
    })

    if (!step || step.pipeline.user_id !== user.id) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 })
    }

    await prisma.step.delete({ where: { id: stepId } })

    // Reorder remaining steps
    const remainingSteps = await prisma.step.findMany({
      where: { pipeline_id: step.pipeline_id },
      orderBy: { order: "asc" },
    })

    await Promise.all(
      remainingSteps.map((s, index) =>
        prisma.step.update({
          where: { id: s.id },
          data: { order: index },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete step:", error)
    return NextResponse.json(
      { error: "Failed to delete step", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
