import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pipelines = await prisma.pipeline.findMany({
      where: { user_id: user.id },
      include: {
        _count: {
          select: { steps: true, runs: true },
        },
      },
      orderBy: { updated_at: "desc" },
    })

    return NextResponse.json(pipelines)
  } catch (error) {
    console.error("Failed to list pipelines:", error)
    return NextResponse.json(
      { error: "Failed to list pipelines" },
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
    const { name, description, tags } = body

    if (!name) {
      return NextResponse.json(
        { error: "Pipeline name is required" },
        { status: 400 }
      )
    }

    const pipeline = await prisma.pipeline.create({
      data: {
        user_id: user.id,
        name,
        description: description || null,
        tags: tags || [],
        steps: {
          create: {
            order: 0,
            name: "Step 1",
            user_prompt: "",
            provider: "openai",
            model: "gpt-4o-mini",
          },
        },
      },
      include: {
        steps: true,
        _count: {
          select: { steps: true, runs: true },
        },
      },
    })

    return NextResponse.json(pipeline, { status: 201 })
  } catch (error) {
    console.error("Failed to create pipeline:", error)
    return NextResponse.json(
      { error: "Failed to create pipeline" },
      { status: 500 }
    )
  }
}
