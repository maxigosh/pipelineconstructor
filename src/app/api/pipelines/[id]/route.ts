import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const pipeline = await prisma.pipeline.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { order: "asc" },
        },
      },
    })

    if (!pipeline) {
      return NextResponse.json(
        { error: "Pipeline not found" },
        { status: 404 }
      )
    }

    if (pipeline.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(pipeline)
  } catch (error) {
    console.error("Failed to get pipeline:", error)
    return NextResponse.json(
      { error: "Failed to get pipeline" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, tags } = body

    const pipeline = await prisma.pipeline.findUnique({
      where: { id },
    })

    if (!pipeline) {
      return NextResponse.json(
        { error: "Pipeline not found" },
        { status: 404 }
      )
    }

    if (pipeline.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updated = await prisma.pipeline.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(tags !== undefined && { tags }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Failed to update pipeline:", error)
    return NextResponse.json(
      { error: "Failed to update pipeline" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const pipeline = await prisma.pipeline.findUnique({
      where: { id },
    })

    if (!pipeline) {
      return NextResponse.json(
        { error: "Pipeline not found" },
        { status: 404 }
      )
    }

    if (pipeline.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.pipeline.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete pipeline:", error)
    return NextResponse.json(
      { error: "Failed to delete pipeline" },
      { status: 500 }
    )
  }
}
