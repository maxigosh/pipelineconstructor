import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
      return NextResponse.json(
        { error: "Pipeline not found" },
        { status: 404 }
      )
    }

    const runs = await prisma.run.findMany({
      where: { pipeline_id: pipelineId },
      include: {
        step_results: {
          orderBy: { step_order: "asc" },
        },
      },
      orderBy: { created_at: "desc" },
    })

    return NextResponse.json(runs)
  } catch (error) {
    console.error("Failed to list runs:", error)
    return NextResponse.json(
      { error: "Failed to list runs" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { pipeline_id, input } = body

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
      return NextResponse.json(
        { error: "Pipeline not found" },
        { status: 404 }
      )
    }

    const run = await prisma.run.create({
      data: {
        pipeline_id,
        user_id: user.id,
        input: input || {},
      },
      include: {
        step_results: true,
      },
    })

    return NextResponse.json(run, { status: 201 })
  } catch (error) {
    console.error("Failed to create run:", error)
    return NextResponse.json(
      { error: "Failed to create run" },
      { status: 500 }
    )
  }
}
