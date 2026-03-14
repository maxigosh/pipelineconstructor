import { cookies } from "next/headers"
import { createSupabaseServerClient } from "./supabase"
import { prisma } from "./prisma"

export async function getAuthUser() {
  try {
    const cookieStore = await cookies()
    const supabaseToken = cookieStore.get("sb-access-token")?.value

    if (!supabaseToken) {
      return null
    }

    const supabase = createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser(supabaseToken)

    if (error || !user) {
      return null
    }

    // Find or create user in our database
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    })

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email: user.email!,
          name: user.user_metadata?.full_name || user.email!.split("@")[0],
          avatar_url: user.user_metadata?.avatar_url,
        },
      })
    }

    return dbUser
  } catch {
    return null
  }
}

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"

// For demo/development: get or create a demo user with a fixed UUID
export async function getDemoUser() {
  const user = await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: {
      id: DEMO_USER_ID,
      email: "demo@pipeline.dev",
      name: "Demo User",
    },
  })

  return user
}

export async function getCurrentUser() {
  try {
    const authUser = await getAuthUser()
    if (authUser) return authUser
  } catch {
    // Supabase auth failed, fall through to demo user
  }

  // Always fall back to demo user when Supabase Auth is not configured
  try {
    return await getDemoUser()
  } catch (e) {
    console.error("Failed to get/create demo user:", e)
    // Return a minimal user object so routes never get null
    return { id: DEMO_USER_ID, email: "demo@pipeline.dev", name: "Demo User", avatar_url: null, created_at: new Date() }
  }
}
