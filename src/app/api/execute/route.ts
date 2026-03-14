import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { PipelineRunner } from "@/lib/pipeline-runner"
import type { PipelineProgress } from "@/lib/pipeline-runner"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    const { pipelineId, input } = await request.json()

    if (!pipelineId) {
      return new Response(JSON.stringify({ error: "pipelineId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Fetch pipeline with steps
    const pipeline = await prisma.pipeline.findFirst({
      where: { id: pipelineId, user_id: user.id },
      include: {
        steps: {
          orderBy: { order: "asc" },
        },
      },
    })

    if (!pipeline) {
      return new Response(JSON.stringify({ error: "Pipeline not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (pipeline.steps.length === 0) {
      return new Response(JSON.stringify({ error: "Pipeline has no steps" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Create Run record
    const run = await prisma.run.create({
      data: {
        pipeline_id: pipelineId,
        user_id: user.id,
        status: "running",
        input: input || {},
        started_at: new Date(),
      },
    })

    // Set up SSE stream
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    const sendEvent = async (type: string, stepOrder: number, data: any) => {
      const event = JSON.stringify({ type, stepOrder, data })
      await writer.write(encoder.encode(`data: ${event}\n\n`))
    }

    // Run pipeline in background
    const runPipeline = async () => {
      try {
        const runner = new PipelineRunner(
          pipeline.steps.map((s) => ({
            id: s.id,
            order: s.order,
            name: s.name,
            system_prompt: s.system_prompt,
            user_prompt: s.user_prompt,
            provider: s.provider,
            model: s.model,
            api_key_id: s.api_key_id,
            config: s.config,
            output_mapping: s.output_mapping,
          })),
          input || {}
        )

        const onProgress = async (progress: PipelineProgress) => {
          await sendEvent(progress.type, progress.stepOrder, progress.data)
        }

        const results = await runner.run(onProgress)

        // Store step results in DB
        let totalTokens = 0
        for (const result of results) {
          await prisma.stepResult.create({
            data: {
              run_id: run.id,
              step_id: result.stepId,
              step_order: result.stepOrder,
              status: result.status === "completed" ? "completed" : "failed",
              output: { content: result.output || "", mapped: result.mappedOutput || "" },
              tokens_used: result.tokens?.total || 0,
              latency_ms: result.latency_ms || 0,
              error: result.error || null,
            },
          })
          totalTokens += result.tokens?.total || 0
        }

        // Update run status
        const hasFailed = results.some((r) => r.status === "failed")
        await prisma.run.update({
          where: { id: run.id },
          data: {
            status: hasFailed ? "failed" : "completed",
            completed_at: new Date(),
            total_tokens: totalTokens,
          },
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error"

        await prisma.run.update({
          where: { id: run.id },
          data: {
            status: "failed",
            completed_at: new Date(),
          },
        })

        await sendEvent("step_error", -1, {
          stepName: "Pipeline Error",
          error: errorMessage,
        })
      } finally {
        await writer.close()
      }
    }

    // Start pipeline execution without awaiting
    runPipeline()

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error"
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
