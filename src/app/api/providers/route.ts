import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt, maskApiKey } from "@/lib/encryption"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
    })

    // Return masked keys, never the raw encrypted key
    const maskedKeys = apiKeys.map((key) => {
      const decryptedKey = decrypt(key.encrypted_key)
      return {
        id: key.id,
        provider: key.provider,
        label: key.label,
        masked_key: maskApiKey(decryptedKey),
        base_url: key.base_url,
        is_active: key.is_active,
        last_used_at: key.last_used_at,
        created_at: key.created_at,
      }
    })

    return NextResponse.json(maskedKeys)
  } catch (error) {
    console.error("Failed to list API keys:", error)
    return NextResponse.json(
      { error: "Failed to list API keys", details: error instanceof Error ? error.message : String(error) },
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
    const { provider, label, key, base_url } = body

    if (!provider || !label || !key) {
      return NextResponse.json(
        { error: "provider, label, and key are required" },
        { status: 400 }
      )
    }

    const encrypted_key = encrypt(key)

    const apiKey = await prisma.apiKey.create({
      data: {
        user_id: user.id,
        provider,
        label,
        encrypted_key,
        base_url: base_url || null,
      },
    })

    return NextResponse.json(
      {
        id: apiKey.id,
        provider: apiKey.provider,
        label: apiKey.label,
        masked_key: maskApiKey(key),
        base_url: apiKey.base_url,
        is_active: apiKey.is_active,
        last_used_at: apiKey.last_used_at,
        created_at: apiKey.created_at,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Failed to create API key:", error)
    return NextResponse.json(
      { error: "Failed to create API key", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const keyId = request.nextUrl.searchParams.get("id")
    if (!keyId) {
      return NextResponse.json(
        { error: "API key id is required" },
        { status: 400 }
      )
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
    })

    if (!apiKey || apiKey.user_id !== user.id) {
      return NextResponse.json(
        { error: "API key not found" },
        { status: 404 }
      )
    }

    await prisma.apiKey.delete({ where: { id: keyId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete API key:", error)
    return NextResponse.json(
      { error: "Failed to delete API key", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
