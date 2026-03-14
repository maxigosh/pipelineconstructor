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

    const run = await prisma.run.findUnique({
      where: { id },
      include: {
        step_results: {
          orderBy: { step_order: "asc" },
          include: {
            step: {
              select: { name: true },
            },
          },
        },
      },
    })

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 })
    }

    if (run.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(run)
  } catch (error) {
    console.error("Failed to get run:", error)
    return NextResponse.json(
      { error: "Failed to get run" },
      { status: 500 }
    )
  }
}
