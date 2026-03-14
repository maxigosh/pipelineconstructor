import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/encryption"
import { getProviderInfo } from "@/lib/providers"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { api_key_id } = body

    if (!api_key_id) {
      return NextResponse.json(
        { error: "api_key_id is required" },
        { status: 400 }
      )
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { id: api_key_id },
    })

    if (!apiKey || apiKey.user_id !== user.id) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      )
    }

    const decryptedKey = decrypt(apiKey.encrypted_key)
    const providerInfo = getProviderInfo(apiKey.provider)
    const baseUrl = apiKey.base_url || providerInfo.baseUrl
    const model = providerInfo.models[0] || "gpt-4o-mini"

    try {
      if (apiKey.provider === "anthropic") {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": decryptedKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: 10,
            messages: [{ role: "user", content: "Hi" }],
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          return NextResponse.json({
            success: false,
            error:
              errorData.error?.message ||
              `API returned status ${response.status}`,
          })
        }

        return NextResponse.json({ success: true })
      } else if (apiKey.provider === "google") {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${decryptedKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { parts: [{ text: "Hi" }] },
              ],
            }),
          }
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          return NextResponse.json({
            success: false,
            error:
              errorData.error?.message ||
              `API returned status ${response.status}`,
          })
        }

        return NextResponse.json({ success: true })
      } else {
        // openai, groq, openrouter, mistral, custom - all use OpenAI-compatible API
        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${decryptedKey}`,
          },
          body: JSON.stringify({
            model,
            max_tokens: 10,
            messages: [{ role: "user", content: "Hi" }],
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          return NextResponse.json({
            success: false,
            error:
              errorData.error?.message ||
              `API returned status ${response.status}`,
          })
        }

        return NextResponse.json({ success: true })
      }
    } catch (fetchError) {
      return NextResponse.json({
        success: false,
        error:
          fetchError instanceof Error
            ? fetchError.message
            : "Connection failed",
      })
    }
  } catch (error) {
    console.error("Failed to test API key:", error)
    return NextResponse.json(
      { error: "Failed to test API key", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
