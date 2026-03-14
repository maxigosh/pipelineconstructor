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

// For demo/development: get or create a demo user
export async function getDemoUser() {
  let user = await prisma.user.findUnique({
    where: { email: "demo@pipeline.dev" },
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "demo@pipeline.dev",
        name: "Demo User",
      },
    })
  }

  return user
}

export async function getCurrentUser() {
  const authUser = await getAuthUser()
  if (authUser) return authUser

  // Fallback to demo user in development
  if (process.env.NODE_ENV === "development") {
    return getDemoUser()
  }

  return null
}
